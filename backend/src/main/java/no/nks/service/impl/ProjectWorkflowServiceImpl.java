package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import no.nks.dto.ProjectDto;
import no.nks.dto.RequestResponse;
import no.nks.dto.workflow.*;
import no.nks.entity.*;
import no.nks.repository.*;
import no.nks.service.EmailService;
import no.nks.service.ProjectService;
import no.nks.service.ProjectWorkflowService;
import no.nks.service.S3Service;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import no.nks.service.PdfService;
import no.nks.dto.ProjectPartyDetailsDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.*;
import java.util.function.BinaryOperator;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Pattern;
import no.nks.service.ProjectWorkflowAsyncService;
import no.nks.service.TripletexService;
import no.nks.dto.third.tripletex.*;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectWorkflowServiceImpl implements ProjectWorkflowService {

    private final ProjectWorkflowStepsRepository projectWorkflowStepsRepository;
    private final ProjectService projectService;
    private final EmailService emailService;
    private final S3Service s3Service;

    /** 私有桶:工作流附件供前端预览需用预签名 URL,否则普通公开 URL 会 S3 AccessDenied。 */
    private static final int ATTACHMENT_URL_TTL_MINUTES = 120;

    private String presignedAttachmentUrl(String folder, String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return null;
        }
        String publicUrl = s3Service.createPublicUrl(null, null, folder, fileName);
        String presigned = s3Service.generatePresignedUrl(publicUrl, ATTACHMENT_URL_TTL_MINUTES);
        // 预签名失败时不要回退公开 URL(私有桶会 AccessDenied)
        return (presigned != null && !presigned.isEmpty()) ? presigned : null;
    }

    /** 按步骤尝试可能的 S3 目录(生成 PDF 与用户重传可能落在不同目录)。 */
    private String resolvePresignedAttachment(Integer workflowStepId, String fileName) {
        List<String> folders = new ArrayList<>();
        if (workflowStepId != null && workflowStepId == 2) {
            folders.add("workflow/step2/");
            folders.add("pdf/");
        } else if (workflowStepId != null && (workflowStepId == 14 || workflowStepId == 18)) {
            folders.add("final-report-pdf/");
            folders.add("pdf/");
        } else {
            folders.add("pdf/");
        }
        for (String folder : folders) {
            String url = presignedAttachmentUrl(folder, fileName);
            if (url != null) {
                return url;
            }
        }
        return null;
    }

    private void applyAttachmentUrls(ProjectWorkflowDto item, List<String> fileNames) {
        if (fileNames == null || fileNames.isEmpty()) {
            return;
        }
        List<String> urls = new ArrayList<>();
        List<String> names = new ArrayList<>();
        for (String raw : fileNames) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String name = raw.trim();
            String url = resolvePresignedAttachment(item.getWorkflowStepId(), name);
            if (url != null) {
                urls.add(url);
                names.add(name);
            }
        }
        if (urls.isEmpty()) {
            return;
        }
        item.setAttachmentURL(urls.get(0));
        item.setAttachmentURLs(urls);
        item.setFileNames(names);
        item.setFileUrls(urls);
    }
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final ContactRepository contactRepository;
    private final BuildingSupplierRepository buildingSupplierRepository;
    private final GeneralSettingRepository generalSettingRepository;
    private final EmailHistoryRepository emailHistoryRepository;
    private final PdfService pdfService;
    private final ProjectServiceRepository projectServiceRepository;
    private final ServiceRepository serviceRepository;
    private final PostNumberRepository postNumberRepository;
    private final DocRepository docRepository;
    private final ProjectPartyRepository projectPartyRepository;
    private final ProjectWorkflowAsyncService projectWorkflowAsyncService;
    private final TripletexService tripletexService;


    @Override
    public WrapperMultiProjectWorkflowDto getProjectWorkflowStep(Integer projectId, Integer workflowId, Integer workflowStepId) {
        List<ProjectWorkflowSteps> workflowSteps = projectWorkflowStepsRepository
                .findByProjectIdAndWorkflowIdAndWorkflowStepId(projectId, workflowId, workflowStepId);

        List<ProjectWorkflowDto> projectWorkflowDtos = workflowSteps.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return WrapperMultiProjectWorkflowDto.builder()
                .multiProjectWorkflow(projectWorkflowDtos)
                .build();
    }

    @Override
    public WrapperMultiProjectWorkflowDto getProjectWorkflowCompletedTransferedSteps(Integer projectId, Integer workflowId) {
        List<ProjectWorkflowSteps> workflowSteps = projectWorkflowStepsRepository
                .findByProjectIdAndWorkflowIdOrderByWorkflowStepId(projectId, workflowId);

        List<ProjectWorkflowDto> multiProjectWorkflow = new ArrayList<>(
                workflowSteps.stream()
                        .collect(Collectors.toMap(
                                ProjectWorkflowSteps::getWorkflowStepId,
                                this::convertToDto,
                                BinaryOperator.maxBy(Comparator.comparing(ProjectWorkflowDto::getInsertDate, Comparator.nullsLast(Comparator.naturalOrder())))
                        ))
                        .values()
        );
        multiProjectWorkflow.sort(Comparator.comparing(ProjectWorkflowDto::getWorkflowStepId));

        List<Integer> projectStepsWithEmail = List.of(1, 2, 4, 8, 9, 12, 13, 14, 18);

        boolean needProjectFields = multiProjectWorkflow.stream().anyMatch(item -> {
            Integer sid = item.getWorkflowStepId();
            return sid != null && (sid == 7 || sid == 10 || sid == 11);
        });
        Project projectSnapshot = null;
        if (needProjectFields) {
            projectSnapshot = projectRepository.findById(projectId).orElse(null);
        }

        for (ProjectWorkflowDto item : multiProjectWorkflow) {
            Integer stepId = item.getWorkflowStepId();

            // 步骤 3(IG):上传文件在 Doc 表,不在 EmailHistory
            if (stepId != null && stepId == 3) {
                List<Doc> docs = docRepository.findByProjectIdAndWorkflowStepId(item.getProjectId(), 3);
                if (docs != null && !docs.isEmpty()) {
                    List<String> names = docs.stream()
                            .map(Doc::getFileName)
                            .filter(n -> n != null && !n.isBlank())
                            .collect(Collectors.toList());
                    applyAttachmentUrls(item, names);
                }
                continue;
            }

            // 非邮件类:回填项目字段(提醒日 / 检验日 / 报告批准)
            if (stepId != null && !projectStepsWithEmail.contains(stepId)) {
                if (projectSnapshot != null) {
                    if (stepId == 7) {
                        item.setContactCustomerDate(projectSnapshot.getRemContactCustomerDate());
                    } else if (stepId == 10) {
                        item.setProjectInspectionDate(projectSnapshot.getInspectionDate());
                        item.setProjectInspectorId(projectSnapshot.getInspectorId());
                        item.setProjectSkipInspection(projectSnapshot.getSkipInspection());
                    } else if (stepId == 11) {
                        item.setIsApprovedInspReport(projectSnapshot.getIsApprovedInspReport());
                    }
                }
                continue;
            }

            // 邮件类步骤：从 EmailHistory 回填最终发出内容（含 Overført 后仍有历史的情况）
            if (!projectStepsWithEmail.contains(stepId)) {
                continue;
            }

            if (stepId == 9) {
                item.setEmailHistoryId(item.getEmailHistoryId() != null ? item.getEmailHistoryId() : 0);
                List<EmailHistory> objEmailHistoryList = emailHistoryRepository
                        .findByProjectIdAndWorkflowStepIdOrderByDateDesc(item.getProjectId(), 9);

                Map<Integer, EmailHistory> latestEmailByPartyType = objEmailHistoryList.stream()
                        .filter(h -> h.getPartyTypeId() != null)
                        .collect(Collectors.toMap(
                                EmailHistory::getPartyTypeId,
                                Function.identity(),
                                (e1, e2) -> e1.getDate() != null && e2.getDate() != null && e1.getDate().isAfter(e2.getDate())
                                        ? e1 : e2
                        ));

                item.setEmailProjectPartiesSent(latestEmailByPartyType.values().stream().map(emailHistory -> {
                    var sentDto = new EmailProjectPartiesSentDto();
                    sentDto.setEmailContent(emailHistory.getMessage());
                    sentDto.setEmailFrom(emailHistory.getFromEmail());
                    sentDto.setEmailTo(emailHistory.getToEmail());
                    sentDto.setEmailSubject(emailHistory.getSubject());
                    sentDto.setPartyID(emailHistory.getPartyId());
                    sentDto.setPartyTypeID(emailHistory.getPartyTypeId());
                    return sentDto;
                }).collect(Collectors.toList()));
                continue;
            }

            EmailHistory history = null;
            if (item.getEmailHistoryId() != null && item.getEmailHistoryId() > 0) {
                history = emailHistoryRepository.findById(item.getEmailHistoryId()).orElse(null);
            }
            // 兼容旧数据：步骤未写 taskId 时按 project+workflow+step 取最新一封
            if (history == null) {
                List<EmailHistory> emails = emailHistoryRepository.findByProjectIdAndWorkflowIdAndWorkflowStepId(
                        item.getProjectId(), item.getWorkflowId(), item.getWorkflowStepId());
                history = emails.stream()
                        .sorted(Comparator.comparing(EmailHistory::getId, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                        .findFirst()
                        .orElse(null);
            }
            if (history == null) {
                continue;
            }

            item.setEmailContent(history.getMessage());
            item.setEmailFrom(history.getFromEmail());
            item.setEmailTo(history.getToEmail());
            item.setEmailSubject(history.getSubject());
            if (item.getEmailHistoryId() == null || item.getEmailHistoryId() <= 0) {
                item.setEmailHistoryId(history.getId());
            }
            if (history.getFileName() != null && !history.getFileName().isEmpty()) {
                List<String> names = Arrays.stream(history.getFileName().split("[,;]"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());
                applyAttachmentUrls(item, names);
            }
        }


        return WrapperMultiProjectWorkflowDto.builder()
                .multiProjectWorkflow(multiProjectWorkflow)
                .build();
    }

    private WrapperProjectWorkflowDto populateEmailFromData(ProjectWorkflowDto param, WorkflowDataBundle data) {
        WrapperProjectWorkflowDto wrapper = new WrapperProjectWorkflowDto();

        String emailFrom = data.generalSetting != null ? data.generalSetting.getSenderEmailAddress() : "default@example.com";
        String emailTo = "";

        if (param.getEmailTempId() != 2 && param.getEmailTempId() != 9) {
            emailTo = data.customer != null ? data.customer.getEmail() : "";
        } else {
            emailTo = data.contactPerson != null ? data.contactPerson.getEmail() : "";
        }

        String templateContent = data.template.getTemplate();
        String templateTitle = data.template.getTitle();

        if (data.user != null) {
            templateContent = templateContent.replace("#PhoneNumber#", Objects.toString(data.user.getContactNo(), ""));
            templateContent = templateContent.replace("#Email#", Objects.toString(data.user.getEmail(), ""));
            templateContent = templateContent.replace("#Name#", Objects.toString(data.user.getFullName(), ""));
            templateContent = templateContent.replace("#Designation#", Objects.toString(data.user.getDesignation(), ""));

            templateTitle = templateTitle.replace("#PhoneNumber#", Objects.toString(data.user.getContactNo(), ""));
            templateTitle = templateTitle.replace("#Email#", Objects.toString(data.user.getEmail(), ""));
            templateTitle = templateTitle.replace("#Name#", Objects.toString(data.user.getFullName(), ""));
            templateTitle = templateTitle.replace("#Designation#", Objects.toString(data.user.getDesignation(), ""));
        }

        templateContent = templateContent.replace("#Address#", Objects.toString(data.project.getAddress(), ""));
        templateContent = templateContent.replace("#Description#", Objects.toString(data.project.getDescription(), ""));
        templateContent = templateContent.replace("#ProjectTitle#", Objects.toString(data.project.getTitle(), ""));
        templateTitle = templateTitle.replace("#Address#", Objects.toString(data.project.getAddress(), ""));
        templateTitle = templateTitle.replace("#ProjectTitle#", Objects.toString(data.project.getTitle(), ""));
        templateTitle = templateTitle.replace("#Description#", Objects.toString(data.project.getDescription(), ""));

        if (data.customer != null) {
            templateContent = templateContent.replace("#CustomerName#", Objects.toString(data.customer.getName(), ""));
            templateContent = templateContent.replace("#CustomerPhone#", Objects.toString(data.customer.getContactNo(), ""));
            templateTitle = templateTitle.replace("#CustomerName#", Objects.toString(data.customer.getName(), ""));
            templateTitle = templateTitle.replace("#CustomerPhone#", Objects.toString(data.customer.getContactNo(), ""));
        }

        if (data.buildingSupplier != null) {
            templateContent = templateContent.replace("#BuildingSupplier#", Objects.toString(data.buildingSupplier.getTitle(), ""));
            templateTitle = templateTitle.replace("#BuildingSupplier#", Objects.toString(data.buildingSupplier.getTitle(), ""));
        }

        if (data.contactPerson != null) {
            templateContent = templateContent.replace("#anvarligSokerCompany#", Objects.toString(data.contactPerson.getCompanyName(), ""));
            templateContent = templateContent.replace("#ansvarlig#", Objects.toString(data.contactPerson.getName(), ""));
            templateTitle = templateTitle.replace("#ansvarlig#", Objects.toString(data.contactPerson.getName(), ""));
        } else {
            templateContent = templateContent.replace("#anvarligSokerCompany#", "");
            templateContent = templateContent.replace("#ansvarlig#", "");
            templateTitle = templateTitle.replace("#ansvarlig#", "");
        }


        if (param.getEmailTempId() == 1) {
            BigDecimal price = data.services.stream()
                    .map(s -> {
                        try {
                            return s.getRate() != null && !s.getRate().isEmpty() ? new BigDecimal(s.getRate()) : BigDecimal.ZERO;
                        } catch (NumberFormatException e) {
                            log.error("Could not parse rate '{}' for service id {}", s.getRate(), s.getId());
                            return BigDecimal.ZERO;
                        }
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal priceWithGst = price.multiply(new BigDecimal("1.25"));
            templateContent = templateContent.replace("#priceWithoutGst#", price.toString());
            templateContent = templateContent.replace("#priceWithGst#", priceWithGst.toString());
        }

        if (param.getEmailTempId() == 7 || param.getEmailTempId() == 8) {
            String inspectorName = "";
            if (data.project.getInspectorId() != null) {
                inspectorName = userRepository.findById(data.project.getInspectorId()).map(User::getFullName).orElse("");
            }
            templateContent = templateContent.replace("#InspectorName#", inspectorName);
        }

        param.setEmailContent(templateContent);
        param.setEmailSubject(templateTitle);
        param.setEmailTo(emailTo);
        param.setEmailFrom(emailFrom);
        if (param.getEmailTempId() == 6 && data.projectLeader != null) {
            param.setProjectLeaderEmailTo(data.projectLeader.getEmail());
        }

        wrapper.setProjectWorkflow(param);
        return wrapper;
    }

    @Override
    public WrapperProjectWorkflowDto getProjectWFOneEmailFormated(ProjectWorkflowDto projectWorkflow) {
        log.info("Formatting email for project workflow step 1, project: {}", projectWorkflow.getProjectId());
        projectWorkflow.setEmailTempId(1);
        return formatEmail(projectWorkflow);
    }

    @Override
    public RequestResponse projectWFOne(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        RequestResponse result = new RequestResponse();
        try {
            if (projectWorkflow.getIsTransfer() == null) {
                result.setSuccess(false);
                result.setMessage("IsTransfer parameter is required!");
                return result;
            }

            if (Boolean.FALSE.equals(projectWorkflow.getIsTransfer())) {
                boolean emailSent = emailService.sendEmail(
                        companyId,
                        projectWorkflow.getEmailTo(),
                        projectWorkflow.getEmailSubject(),
                        projectWorkflow.getEmailContent()
                );

                if (emailSent) {
                    emailService.saveEmailHistory(projectWorkflow, companyId);
                    saveWorkflowStepStatus(projectWorkflow);
                    result.setSuccess(true);
                    result.setMessage("Project status updated, email Sent successfully!");
                } else {
                    result.setSuccess(false);
                    result.setMessage("Failed to send email for workflow step 1");
                }
            } else { // isTransfer is true
                saveWorkflowStepStatus(projectWorkflow);
                result.setSuccess(true);
                result.setMessage("Project status updated, Transfer successfully!");
            }
        } catch (Exception e) {
            log.error("Error processing workflow step 1 for project {}", projectWorkflow.getProjectId(), e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }

        return result;
    }

    @Override
    public WrapperProjectWorkflowDto getProjectWFTwoEmailFormated(ProjectWorkflowDto projectWorkflow) {
        log.info("Formatting email for project workflow step 2, project: {}", projectWorkflow.getProjectId());
        long startTime = System.currentTimeMillis();

        projectWorkflow.setEmailTempId(2);

        CompletableFuture<User> userFuture = CompletableFuture.supplyAsync(() -> userRepository.findById(projectWorkflow.getInsertedBy()).orElse(null));
        CompletableFuture<EmailTemplate> templateFuture = CompletableFuture.supplyAsync(() -> emailTemplateRepository.findById(projectWorkflow.getEmailTempId()).orElse(null));
        CompletableFuture<Project> projectFuture = CompletableFuture.supplyAsync(() -> projectRepository.findById(projectWorkflow.getProjectId()).orElse(null));
        CompletableFuture<GeneralSetting> settingFuture = CompletableFuture.supplyAsync(() -> generalSettingRepository.findFirstBy().orElse(null));
        CompletableFuture<List<no.nks.entity.ProjectService>> projectServicesFuture = CompletableFuture.supplyAsync(() -> projectServiceRepository.findByProjectId(projectWorkflow.getProjectId()));

        Project project = projectFuture.join();
        if (project == null) {
            throw new RuntimeException("Project not found for id: " + projectWorkflow.getProjectId());
        }

        CompletableFuture<ContactBook> customerFuture = CompletableFuture.supplyAsync(() -> contactRepository.findById(project.getCustomerId()).orElse(null));
        CompletableFuture<ContactBook> contactPersonFuture = CompletableFuture.supplyAsync(() -> contactRepository.findById(project.getContactPersonId()).orElse(null));
        CompletableFuture<ContactBook> projectLeaderFuture = (project.getProjectLeaderId() != null) ?
                CompletableFuture.supplyAsync(() -> contactRepository.findById(project.getProjectLeaderId()).orElse(null)) :
                CompletableFuture.completedFuture(null);
        CompletableFuture<BuildingSupplier> buildingSupplierFuture = CompletableFuture.supplyAsync(() -> buildingSupplierRepository.findById(project.getBuildingSupplierId()).orElse(null));
        CompletableFuture<PostNumber> postNumberFuture = CompletableFuture.supplyAsync(() -> postNumberRepository.findByPostnummer(Integer.valueOf(project.getPostNo())).orElse(null));

        List<Integer> serviceIds = projectServicesFuture.join().stream().map(no.nks.entity.ProjectService::getServiceId).collect(Collectors.toList());
        CompletableFuture<List<no.nks.entity.Service>> servicesFuture = CompletableFuture.supplyAsync(() -> serviceRepository.findAllById(serviceIds));

        CompletableFuture.allOf(userFuture, templateFuture, settingFuture, customerFuture, contactPersonFuture, projectLeaderFuture, buildingSupplierFuture, postNumberFuture, servicesFuture).join();

        WorkflowDataBundle dataBundle = new WorkflowDataBundle();
        try {
            dataBundle.user = userFuture.get();
            dataBundle.template = templateFuture.get();
            dataBundle.project = project;
            dataBundle.generalSetting = settingFuture.get();
            dataBundle.customer = customerFuture.get();
            dataBundle.contactPerson = contactPersonFuture.get();
            dataBundle.projectLeader = projectLeaderFuture.get();
            dataBundle.buildingSupplier = buildingSupplierFuture.get();
            dataBundle.postNumber = postNumberFuture.get();
            dataBundle.services = servicesFuture.get();
        } catch (Exception e) {
            throw new RuntimeException("Failed to get future results", e);
        }

        if (dataBundle.template == null) {
            throw new RuntimeException("EmailTemplate not found for id: " + projectWorkflow.getEmailTempId());
        }

        WrapperProjectWorkflowDto wrapper = populateEmailFromData(projectWorkflow, dataBundle);

        try {
            PdfService.PdfTemplateData pdfData = new PdfService.PdfTemplateData(
                    dataBundle.project, dataBundle.services, dataBundle.postNumber, dataBundle.generalSetting
            );
            String attachmentUrl = pdfService.generatePdfForStepTwo(wrapper.getProjectWorkflow(), pdfData);
            wrapper.getProjectWorkflow().setAttachmentURL(attachmentUrl);
        } catch (Exception e) {
            log.error("Error generating PDF for workflow step 2", e);
        }

        long endTime = System.currentTimeMillis();
        log.debug("GetProjectWFTwoEmailFormated for project {} took {} ms", projectWorkflow.getProjectId(), (endTime - startTime));

        return wrapper;
    }

    @Override
    public RequestResponse projectWFTwo(ProjectWorkflowDto projectWorkflow, MultipartFile file, Integer companyId) {
        RequestResponse result = new RequestResponse();
        try {
            if (projectWorkflow.getIsTransfer() == null) {
                result.setSuccess(false);
                result.setMessage("IsTransfer parameter is required!");
                return result;
            }

            if (Boolean.FALSE.equals(projectWorkflow.getIsTransfer())) {
                if (file != null && !file.isEmpty()) {
                    String fileName = generateUniqueFileName(file.getOriginalFilename());
                    // 目录只到文件夹级别;把 fileName 拼进目录会导致 S3 key 里文件名重复
                    // (workflow/step2/<fn><fn>),Generert/工作流预览按 workflow/step2/<fn> 就取不到。
                    String bucketFolder = "workflow/step2/";
                    s3Service.uploadFile(bucketFolder, file, fileName);
                    // The original C# code seems to imply the filename is set on the DTO
                    projectWorkflow.setFileName(fileName);
                }

                boolean emailSent = emailService.sendEmailWithAttachment(
                        companyId,
                        projectWorkflow.getEmailTo(),
                        projectWorkflow.getEmailSubject(),
                        projectWorkflow.getEmailContent(),
                        file
                );

                if (emailSent) {
                    emailService.saveEmailHistory(projectWorkflow, companyId);
                    saveWorkflowStepStatus(projectWorkflow);
                    result.setSuccess(true);
                    result.setMessage("Project status updated, email Sent successfully!");
                } else {
                    result.setSuccess(false);
                    result.setMessage("Failed to send email for workflow step 2");
                }
            } else { // isTransfer is true
                saveWorkflowStepStatus(projectWorkflow);
                result.setSuccess(true);
                result.setMessage("Project status updated, Transfer successfully!");
            }
        } catch (Exception e) {
            log.error("Error processing workflow step 2 for project {}", projectWorkflow.getProjectId(), e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }

        return result;
    }

    @Override
    public RequestResponse projectWFThree(ProjectWorkflowDto param, List<MultipartFile> files, Integer companyId) {
        RequestResponse response = new RequestResponse();
        try {
            if (Boolean.TRUE.equals(param.getIsTransfer())) {
                saveWorkflowStepStatus(param);
                response.setSuccess(true);
                response.setMessage("Project status updated.");
            } else {
                Project project = projectRepository.findById(param.getProjectId())
                        .orElseThrow(() -> new RuntimeException("Project not found with id: " + param.getProjectId()));

                List<String> uploadedFileNames = new ArrayList<>();
                if (files != null && !files.isEmpty()) {
                    String title = removeSpecialCharacters(project.getTitle()).replace(" ", "");
                    if (title.length() > 30) {
                        title = title.substring(0, 30);
                    }

                    for (MultipartFile file : files) {
                        String originalFileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
                        String fileNameTrim = FilenameUtils.removeExtension(originalFileName);
                        String fileTitle = removeSpecialCharacters(fileNameTrim).replace(" ", "");
                        if (fileTitle.length() > 30) {
                            fileTitle = fileTitle.substring(0, 30);
                        }

                        Random rand = new Random();
                        String finalName = title + "-" + fileTitle + "-" + "AnsvarligSokerFile" + rand.nextInt(2500) + "." + FilenameUtils.getExtension(originalFileName);

                        // Assuming companyId might be used to determine the bucket details
                        // The C# code uses new StaticDetailsGotDynamic(DataCompany).S3BucketFolderForPDF()
                        // This implies company-specific folders. s3Service should handle this.
                        s3Service.uploadFile("pdf/", file, finalName);
                        uploadedFileNames.add(finalName);
                    }
                }
                param.setFileNames(uploadedFileNames);
                projectWFThreeDone(param);
                saveWorkflowStepStatus(param);
                response.setSuccess(true);
                response.setMessage("Project status updated, Document uploaded successfully!");
            }
        } catch (Exception e) {
            log.error("Error in projectWFThree for project {}", param.getProjectId(), e);
            response.setSuccess(false);
            response.setMessage(e.getMessage());
        }
        return response;
    }

    private void projectWFThreeDone(ProjectWorkflowDto param) {
        param.setInsertDate(LocalDateTime.now());
        if (param.getFileNames() != null) {
            for (String fileName : param.getFileNames()) {
                param.setFileName(fileName);
                Integer docId = insertRecordInDoc(param, 3, null, null);
                // The C# code sets EmailHistoryId, which seems to be a multi-purpose TaskId.
                param.setEmailHistoryId(docId);
            }
        }
    }

    private Integer insertRecordInDoc(ProjectWorkflowDto param, Integer otherDoc, Integer partyTypeId, Integer partyDocTypeId) {
        Doc doc = Doc.builder()
                .projectId(param.getProjectId())
                .workflowId(param.getWorkflowId())
                .workflowStepId(param.getWorkflowStepId())
                .date(param.getInsertDate())
                .otherDocs(otherDoc)
                .fileName(param.getFileName())
                .partyTypeId(partyTypeId)
                .partyDocTypeId(partyDocTypeId)
                // Note: The entity has PartyId, isApproved, CompanyID which are not being set here.
                // Assuming they are nullable or have default values in the DB.
                .build();
        docRepository.save(doc);
        return doc.getId();
    }

    @Override
    public WrapperProjectWorkflowDto getProjectWFThree(ProjectWorkflowDto projectWorkflow) {
        log.info("Getting project workflow step 3 info, project: {}", projectWorkflow.getProjectId());

        // The original C# logic for getting documents for step 3 was convoluted and likely buggy.
        // It seemed to only fetch the last document from the last time the step was executed.
        // A more correct and robust approach is to fetch all documents associated with this project and specific workflow step.
        List<Doc> docs = docRepository.findByProjectIdAndWorkflowStepId(projectWorkflow.getProjectId(), projectWorkflow.getWorkflowStepId());

        List<String> attachmentUrls = new ArrayList<>();
        if (docs != null && !docs.isEmpty()) {
            for (Doc doc : docs) {
                String url = resolvePresignedAttachment(projectWorkflow.getWorkflowStepId(), doc.getFileName());
                if (url != null) {
                    attachmentUrls.add(url);
                }
            }
        }

        projectWorkflow.setAttachmentURLs(attachmentUrls);
        if (!attachmentUrls.isEmpty()) {
            projectWorkflow.setAttachmentURL(attachmentUrls.get(0));
            projectWorkflow.setFileUrls(attachmentUrls);
        }

        WrapperProjectWorkflowDto result = new WrapperProjectWorkflowDto();
        result.setProjectWorkflow(projectWorkflow);
        return result;
    }

    @Override
    public WrapperProjectWorkflowDto getProjectWFFourEmailFormated(ProjectWorkflowDto projectWorkflow) {
        log.info("Formatting email for project workflow step 4, project: {}", projectWorkflow.getProjectId());
        projectWorkflow.setEmailTempId(3);
        return formatEmail(projectWorkflow);
    }

    @Override
    public RequestResponse projectWFFour(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        RequestResponse result = new RequestResponse();
        try {
            if (Boolean.FALSE.equals(projectWorkflow.getIsTransfer())) {
                // EXTREME OPTIMIZATION:
                // 1. Save the status first. This is a fast, synchronous DB write,
                //    providing immediate state consistency in the system.
                saveWorkflowStepStatus(projectWorkflow);

                // 2. Offload the slow email sending and history saving to a background thread.
                //    This call is non-blocking and returns immediately.
                emailService.sendEmailAndSaveHistoryAsync(projectWorkflow, companyId);

                // 3. Return success to the user instantly, without waiting for the email to be sent.
                result.setSuccess(true);
                result.setMessage("Project status updated, email is being sent successfully!");

            } else if (Boolean.TRUE.equals(projectWorkflow.getIsTransfer())) {
                saveWorkflowStepStatus(projectWorkflow);
                result.setSuccess(true);
                result.setMessage("Project status updated, Transfer successfully!");
            } else {
                result.setSuccess(false);
                result.setMessage("IsTransfer parameter is required!");
            }
        } catch (Exception e) {
            log.error("Error processing workflow step 4 for project {}", projectWorkflow.getProjectId(), e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }
        return result;
    }

    private RequestResponse projectWFGenericStepSave(ProjectWorkflowDto projectWorkflow) {
        RequestResponse result = new RequestResponse();
        try {
            String successMessage = "Project status updated.";

            // Specific logic for step 7, matching C# implementation
            if (projectWorkflow.getContactCustomerDate() != null) {
                Project project = projectRepository.findById(projectWorkflow.getProjectId())
                        .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectWorkflow.getProjectId()));
                project.setRemContactCustomerDate(projectWorkflow.getContactCustomerDate());
                projectRepository.save(project);
                successMessage += " Reminder date is set successfully!";
            }

            saveWorkflowStepStatus(projectWorkflow);

            result.setSuccess(true);
            result.setMessage(successMessage);
        } catch (Exception e) {
            log.error("Error processing generic workflow step save for project {}: {}", projectWorkflow.getProjectId(), e.getMessage());
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }
        return result;
    }

    @Override
    public RequestResponse projectWFSeven(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        // OPTIMIZATION NOTE: This endpoint is already highly optimized.
        // Its core logic consists of one or two fast database write operations.
        // No further code optimization is necessary.
        return projectWFGenericStepSave(projectWorkflow);
    }

    @Override
    public RequestResponse projectWFEightTransfer(ProjectWorkflowDto projectWorkflow) {
        log.info("Processing project workflow step 8 transfer, project: {}", projectWorkflow.getProjectId());

        if (Boolean.TRUE.equals(projectWorkflow.getIsTransfer())) {
            return projectWFGenericStepSave(projectWorkflow);
        } else {
            RequestResponse result = new RequestResponse();
            result.setSuccess(false);
            result.setMessage("IsTransfer should be true for this request!");
            return result;
        }
    }

    @Override
    public WrapperProjectWorkflowDto getProjectWFEightEmailFormated(ProjectWorkflowDto projectWorkflow) {
        log.info("Formatting email for project workflow step 8, project: {}", projectWorkflow.getProjectId());
        projectWorkflow.setEmailTempId(6); // As per C# logic
        return formatEmail(projectWorkflow);
    }

    @Override
    public RequestResponse projectWFEightSendEmail(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        RequestResponse result = new RequestResponse();
        try {
            if (Boolean.FALSE.equals(projectWorkflow.getIsTransfer())) {
                // EXTREME OPTIMIZATION:
                // 1. Immediately save the step status for instant UI feedback.
                saveWorkflowStepStatus(projectWorkflow);

                // 2. Asynchronously send email(s) and save history in the background.
                emailService.sendStepEightEmailAndSaveHistoryAsync(projectWorkflow, companyId);

                result.setSuccess(true);
                result.setMessage("Project status updated, email is being sent successfully!");
            } else {
                result.setSuccess(false);
                result.setMessage("IsTransfer should be false for this request!");
            }
        } catch (Exception e) {
            log.error("Error sending email for workflow step 8", e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }

        return result;
    }

    @Override
    public RequestResponse projectWFNineTransfer(ProjectWorkflowDto projectWorkflow) {
        log.info("Processing project workflow step 9 transfer, project: {}", projectWorkflow.getProjectId());

        if (Boolean.TRUE.equals(projectWorkflow.getIsTransfer())) {
            return projectWFGenericStepSave(projectWorkflow);
        } else {
            RequestResponse result = new RequestResponse();
            result.setSuccess(false);
            result.setMessage("IsTransfer should be true for this request!");
            return result;
        }
    }

    @Override
    public WrapperProjectWorkflowDto getProjectWFNineEmailFormated(ProjectWorkflowDto projectWorkflow) {
        log.info("Formatting email for project workflow step 9, project: {}", projectWorkflow.getProjectId());

        // As per C# logic, EmailTempId is 4 for step 9
        projectWorkflow.setEmailTempId(4);

        // First, format the email to get the template content
        WrapperProjectWorkflowDto wrapper = formatEmail(projectWorkflow);
        ProjectWorkflowDto formattedDto = wrapper.getProjectWorkflow();

        // 拉取项目参与方；按 partyTypeId 去重(后写覆盖前写)，避免更换联系人后历史重复行叠出多封邮件
        List<ProjectPartyDetailsDto> parties = projectPartyRepository.findProjectPartyDetailsByProjectId(projectWorkflow.getProjectId());
        Map<Integer, ProjectPartyDetailsDto> uniqueByPartyType = new LinkedHashMap<>();
        for (ProjectPartyDetailsDto party : parties) {
            if (party.getPartyTypeId() == null) {
                continue;
            }
            uniqueByPartyType.put(party.getPartyTypeId(), party);
        }

        List<EmailProjectPartiesWorkflowEntDto> partyEmails = uniqueByPartyType.values().stream().map(party -> {
            var sentDto = new EmailProjectPartiesWorkflowEntDto();
            sentDto.setPartyID(party.getPartyId());
            sentDto.setPartyTypeID(party.getPartyTypeId());
            sentDto.setPartyName(party.getPartyName());
            sentDto.setPartyTypeName(party.getPartyTypeName());
            sentDto.setEmailTo(party.getEmail());
            sentDto.setEmailFrom(formattedDto.getEmailFrom());
            sentDto.setTitle(formattedDto.getEmailSubject());
            // Replace placeholder #PartyName# in the content
            String content = formattedDto.getEmailContent().replace("#PartyName#", Objects.toString(party.getPartyName(), ""));
            sentDto.setContent(content);
            sentDto.setSendEmail(false); // Default value
            return sentDto;
        }).collect(Collectors.toList());

        var emailProjectParties = new EmailProjectPartiesWorkflowDto();
        emailProjectParties.setEmailProjectPartiesWorkflowList(partyEmails);
        formattedDto.setEmailProjectParties(emailProjectParties);

        // As per C# logic, clear the main email fields after populating party emails
        formattedDto.setEmailContent("");
        formattedDto.setEmailSubject("");
        formattedDto.setEmailTo("");
        formattedDto.setEmailFrom("");

        // Logic from C# GetProjectWorkflowCompletedTransferedSteps for step 9
        List<EmailHistory> objEmailHistoryList = emailHistoryRepository.findByProjectIdAndWorkflowStepIdOrderByDateDesc(projectWorkflow.getProjectId(), 9);

        Map<Integer, EmailHistory> latestEmailByPartyType = objEmailHistoryList.stream()
                .collect(Collectors.toMap(
                        EmailHistory::getPartyTypeId,
                        Function.identity(),
                        (e1, e2) -> e1.getDate().isAfter(e2.getDate()) ? e1 : e2
                ));

        List<EmailProjectPartiesSentDto> sentDtos = latestEmailByPartyType.values().stream().map(emailHistory -> {
            var sentDto = new EmailProjectPartiesSentDto();
            sentDto.setPartyID(emailHistory.getPartyId());
            sentDto.setPartyTypeID(emailHistory.getPartyTypeId());
            sentDto.setEmailSubject(emailHistory.getSubject());
            sentDto.setEmailContent(emailHistory.getMessage());
            sentDto.setEmailTo(emailHistory.getToEmail());
            sentDto.setEmailFrom(emailHistory.getFromEmail());
            return sentDto;
        }).collect(Collectors.toList());

        formattedDto.setEmailProjectPartiesSent(sentDtos);

        return wrapper;
    }

    @Override
    public RequestResponse projectWFNineSendEmail(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        RequestResponse result = new RequestResponse();
        try {
            if (Boolean.FALSE.equals(projectWorkflow.getIsTransfer())) {
                // EXTREME OPTIMIZATION:
                // 1. Immediately save the step status to ensure system state consistency.
                saveWorkflowStepStatus(projectWorkflow);

                // 2. Asynchronously send all personalized emails and save their history.
                emailService.sendStepNineEmailsAndSaveHistoryAsync(projectWorkflow, companyId);

                result.setSuccess(true);
                result.setMessage("Project status updated, emails are being sent successfully!");
            } else {
                result.setSuccess(false);
                result.setMessage("IsTransfer should be false for this request!");
            }
        } catch (Exception e) {
            log.error("Error processing workflow step 9 for project {}", projectWorkflow.getProjectId(), e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }
        return result;
    }

    @Override
    public RequestResponse projectWFTenTransfer(ProjectWorkflowDto projectWorkflow) {
        log.info("Processing project workflow step 10 transfer, project: {}", projectWorkflow.getProjectId());

        if (Boolean.TRUE.equals(projectWorkflow.getIsTransfer())) {
            return projectWFGenericStepSave(projectWorkflow);
        } else {
            RequestResponse result = new RequestResponse();
            result.setSuccess(false);
            result.setMessage("IsTransfer should be true for this request!");
            return result;
        }
    }

    @Override
    public RequestResponse projectWFTen(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        RequestResponse result = new RequestResponse();
        try {
            // Find the project to be updated.
            Project project = projectRepository.findById(projectWorkflow.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectWorkflow.getProjectId()));

            // Synchronously update critical project details.
            project.setInspectionDate(projectWorkflow.getProjectInspectionDate());
            project.setInspectorId(projectWorkflow.getProjectInspectorId());
            if (projectWorkflow.getProjectSkipInspection() != null) {
                project.setSkipInspection(projectWorkflow.getProjectSkipInspection());
            }
            projectRepository.save(project);

            // Always save the workflow step status synchronously.
            saveWorkflowStepStatus(projectWorkflow);

            // Asynchronously send email if requested.
            if (Boolean.TRUE.equals(projectWorkflow.getIsInspectorEmail())) {
                 if (projectWorkflow.getEmailTo() == null || projectWorkflow.getEmailTo().isEmpty()) {
                    // C# returns success but with a warning. We will do the same.
                    // The main operation succeeded. The email part is optional.
                    result.setMessage("Project status updated, but could not send email: Inspector's email not found.");
                } else {
                    // Prepare calendar details, matching C# logic
                    String eventDescription = "Inspection for project: " + project.getTitle() + "\\n" +
                                            "Address: " + project.getAddress();
                    String calendarSummary = "Inspection: " + project.getTitle();

                    // Offload the slow email sending to a background thread.
                    emailService.sendStepTenEmailAsync(projectWorkflow, companyId, eventDescription, calendarSummary);
                    result.setMessage("Project status updated. Inspector email is being sent.");
                }
            } else {
                 result.setMessage("Project status updated.");
            }

            result.setSuccess(true);

        } catch (Exception e) {
            log.error("Error processing workflow step 10", e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }

        return result;
    }

    @Override
    public RequestResponse projectWFElevenDone(ProjectWorkflowDto projectWorkflow) {
        log.info("Processing project workflow step 11, project: {}", projectWorkflow.getProjectId());
        RequestResponse result = new RequestResponse();
        try {
            if (Boolean.FALSE.equals(projectWorkflow.getIsTransfer())) {
                if (projectWorkflow.getIsApprovedInspReport() == null) {
                    result.setSuccess(false);
                    result.setMessage("IsApprovedInspReport parameter is required when not transferring.");
                    return result;
                }
                Project project = projectRepository.findById(projectWorkflow.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectWorkflow.getProjectId()));

                project.setIsApprovedInspReport(projectWorkflow.getIsApprovedInspReport());
                projectRepository.save(project);
            }

            saveWorkflowStepStatus(projectWorkflow);

            result.setSuccess(true);
            result.setMessage("Project status updated.");

        } catch (Exception e) {
            log.error("Error processing workflow step 11 for project {}", projectWorkflow.getProjectId(), e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }

        return result;
    }

    @Override
    public WrapperProjectWorkflowDto getProjectWFTwelveEmailFormated(ProjectWorkflowDto projectWorkflow) {
        log.info("Formatting email for project workflow step 12, project: {}", projectWorkflow.getProjectId());

        projectWorkflow.setEmailTempId(18); // This is correct as per C# logic

        WrapperProjectWorkflowDto result = formatEmail(projectWorkflow);

        return result;
    }

    @Override
    public RequestResponse projectWFTwelve(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        log.info("Processing project workflow step 12, project: {}", projectWorkflow.getProjectId());
        RequestResponse result = new RequestResponse();
        try {
            if (Boolean.FALSE.equals(projectWorkflow.getIsTransfer())) {
                // Asynchronously send email and save history
                emailService.sendEmailAndSaveHistoryAsync(projectWorkflow, companyId);
                saveWorkflowStepStatus(projectWorkflow);
                result.setSuccess(true);
                result.setMessage("Project status updated, email is being sent successfully!");
            } else if (Boolean.TRUE.equals(projectWorkflow.getIsTransfer())) {
                saveWorkflowStepStatus(projectWorkflow);
                result.setSuccess(true);
                result.setMessage("Project status updated, Transfer successfully!");
            } else {
                result.setSuccess(false);
                result.setMessage("IsTransfer parameter is required!");
            }
        } catch (Exception e) {
            log.error("Error processing workflow step 12 for project {}", projectWorkflow.getProjectId(), e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }
        return result;
    }

    @Override
    public WrapperProjectWorkflowDto getProjectWFThirteenEmailFormated(ProjectWorkflowDto projectWorkflow) throws Exception {
        log.info("Formatting email with PDF for project workflow step 13, project: {}", projectWorkflow.getProjectId());
        projectWorkflow.setEmailTempId(9); // Correct as per C# logic
        WrapperProjectWorkflowDto result = formatEmail(projectWorkflow);

        // 构建PdfTemplateData对象
        Project project = projectRepository.findById(projectWorkflow.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found for id: " + projectWorkflow.getProjectId()));

        List<no.nks.entity.ProjectService> projectServices = projectServiceRepository.findByProjectId(project.getId());
        List<Integer> serviceIds = projectServices.stream().map(no.nks.entity.ProjectService::getServiceId).collect(Collectors.toList());
        List<no.nks.entity.Service> services = serviceRepository.findAllById(serviceIds);

        PostNumber postNumber = null;
        if (project.getPostNo() != null && !project.getPostNo().isEmpty()) {
            postNumber = postNumberRepository.findByPostnummer(Integer.valueOf(project.getPostNo())).orElse(null);
        }

        GeneralSetting generalSetting = generalSettingRepository.findFirstBy().orElse(null);

        PdfService.PdfTemplateData pdfData = new PdfService.PdfTemplateData(
                project, services, postNumber, generalSetting
        );

        String pdfUrl = pdfService.generatePdfForStepThirteen(result.getProjectWorkflow(), pdfData);
        result.getProjectWorkflow().setAttachmentURL(pdfUrl);
        return result;
    }

    @Override
    public RequestResponse projectWFThirteen(ProjectWorkflowDto projectWorkflow, MultipartFile file, Integer companyId) {
        log.info("Processing project workflow step 13 with file, project: {}", projectWorkflow.getProjectId());
        RequestResponse result = new RequestResponse();
        try {
            if (Boolean.FALSE.equals(projectWorkflow.getIsTransfer())) {
                // 1. Critical, synchronous operation for immediate state feedback
                saveWorkflowStepStatus(projectWorkflow);

                // 2. Offload all heavy tasks to a background thread
                byte[] fileBytes = (file != null && !file.isEmpty()) ? file.getBytes() : null;
                String originalFilename = (file != null) ? file.getOriginalFilename() : null;

                projectWorkflowAsyncService.performStep13BackgroundTasks(projectWorkflow, fileBytes, originalFilename, companyId);

                // 3. Return success response to the user instantly
                result.setSuccess(true);
                result.setMessage("Workflow step 13 request accepted. Processing is underway in the background.");

            } else if (Boolean.TRUE.equals(projectWorkflow.getIsTransfer())) {
                saveWorkflowStepStatus(projectWorkflow);
                result.setSuccess(true);
                result.setMessage("Project status updated, Transfer successfully!");
            } else {
                 result.setSuccess(false);
                 result.setMessage("IsTransfer parameter is required!");
            }
        } catch (Exception e) {
            log.error("Error processing workflow step 13 for project {}", projectWorkflow.getProjectId(), e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }
        return result;
    }

    @Override
    public WrapperProjectInvoiceDataDto projectWFFifteenGetDetails(Integer projectId, Integer companyId) {
        log.info("Getting details for project workflow step 15, project: {}", projectId);

        try {
            ProjectDto project = projectService.getProjectById(projectId, companyId);

            if (project.getInvoiceTripletexID() != null && !project.getInvoiceTripletexID().isEmpty()) {
                 return WrapperProjectInvoiceDataDto.builder()
                    .projectInvoiceDataENT(ProjectInvoiceDataDto.builder().build())
                    .build();
            }

            ProjectInvoiceDataDto invoiceData = ProjectInvoiceDataDto.builder()
                    .projectId(projectId)
                    .workflowStepId(15)
                    .invoiceDetails(project.getTitle()) // Using project title as invoice detail as per original logic
                    .build();

            return WrapperProjectInvoiceDataDto.builder()
                    .projectInvoiceDataENT(invoiceData)
                    .build();

        } catch (Exception e) {
            log.error("Error getting details for workflow step 15", e);
            ProjectInvoiceDataDto errorInvoiceData = ProjectInvoiceDataDto.builder()
                .projectId(projectId)
                .workflowStepId(15)
                .invoiceDetails("Error getting project details: " + e.getMessage())
                .build();

            return WrapperProjectInvoiceDataDto.builder()
                    .projectInvoiceDataENT(errorInvoiceData)
                    .build();
        }
    }

    @Override
    public RequestResponse projectWFFifteen(ProjectWorkflowDto projectWorkflow) {
        if (projectWorkflow == null || projectWorkflow.getProjectId() == null) {
            return new RequestResponse(false, "Project ID is required.");
        }

        try {
            RequestResponse tripletexResponse = tripletexService.createTripletexOrderFromProject(projectWorkflow.getProjectId());

            if (tripletexResponse.isSuccess()) {
                completedTaskStatusSet(projectWorkflow.getProjectId());
                saveWorkflowStepStatus(projectWorkflow);
            }

            return tripletexResponse;

        } catch (Exception e) {
            log.error("Exception in projectWFFifteen for project ID: {}", projectWorkflow.getProjectId(), e);
            return new RequestResponse(false, "An unexpected error occurred: " + e.getMessage());
        }
    }

    @Override
    public RequestResponse updateProjectWFTwoStepOne(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        log.info("Updating project workflow 2 step 1, project: {}", projectWorkflow.getProjectId());

        RequestResponse result = new RequestResponse();

        try {
            if (Boolean.FALSE.equals(projectWorkflow.getIsTransfer())) {
                Project project = projectRepository.findById(projectWorkflow.getProjectId())
                        .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectWorkflow.getProjectId()));

                if (projectWorkflow.getAvvik() != null) {
                    project.setAvvik(projectWorkflow.getAvvik());
                }
                if (projectWorkflow.getAvvikSendtKommune() != null) {
                    project.setAvvikSendtKommune(projectWorkflow.getAvvikSendtKommune());
                }
                if (projectWorkflow.getTepmlateValue() != null) {
                    project.setTepmlateValue(projectWorkflow.getTepmlateValue());
                }
                projectRepository.save(project);

                saveWorkflowStepStatus(projectWorkflow);
                result.setSuccess(true);
                result.setMessage("Project status updated!");
            } else {
                 saveWorkflowStepStatus(projectWorkflow);
                 result.setSuccess(true);
                 result.setMessage("Project status updated!");
            }
        } catch (Exception e) {
            log.error("Error updating workflow 2 step 1", e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }

        return result;
    }

    @Override
    public WrapperProjectWorkflowDto getProjectWFTwoStepOne(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        log.debug("Getting project workflow 2 step 1 info, project: {}", projectWorkflow.getProjectId());

        WrapperProjectWorkflowDto result = new WrapperProjectWorkflowDto();

        try {
            Project project = projectRepository.findById(projectWorkflow.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectWorkflow.getProjectId()));

            projectWorkflow.setTepmlateValue(project.getTepmlateValue());
            projectWorkflow.setAvvik(project.getAvvik());
            projectWorkflow.setAvvikSendtKommune(project.getAvvikSendtKommune());

            result.setProjectWorkflow(projectWorkflow);
        } catch (Exception e) {
            log.error("Error getting workflow 2 step 1 info", e);
            ProjectWorkflowDto errorDto = new ProjectWorkflowDto();
            errorDto.setProjectId(projectWorkflow.getProjectId());
            errorDto.setWorkflowId(projectWorkflow.getWorkflowId());
            errorDto.setWorkflowStepId(projectWorkflow.getWorkflowStepId());
            errorDto.setEmailSubject("Error");
            errorDto.setEmailContent("Error getting project details: " + e.getMessage());

            result.setProjectWorkflow(errorDto);
        }

        return result;
    }

    private void saveWorkflowStepStatus(ProjectWorkflowDto projectWorkflow) {
        LocalDateTime now = LocalDateTime.now();
        projectWorkflow.setInsertDate(now);

        // 检查是否已存在相同三元组的记录
        ProjectWorkflowSteps existingStep = null;
        if (projectWorkflow.getId() == null) {
            existingStep = findWorkflowStepByTriple(
                projectWorkflow.getProjectId(),
                projectWorkflow.getWorkflowId(),
                projectWorkflow.getWorkflowStepId()
            );
        }

        ProjectWorkflowSteps workflowStep;
        if (existingStep != null) {
            // 如果存在，则更新现有记录
            workflowStep = existingStep;
        } else {
            // 否则创建新记录
            workflowStep = new ProjectWorkflowSteps();
            workflowStep.setProjectId(projectWorkflow.getProjectId());
            workflowStep.setWorkflowId(projectWorkflow.getWorkflowId());
            workflowStep.setWorkflowStepId(projectWorkflow.getWorkflowStepId());
        }

        // 无论是更新还是新建，都设置这些字段
        workflowStep.setIsTransfer(projectWorkflow.getIsTransfer());
        workflowStep.setTaskId(projectWorkflow.getTaskId() != null ? projectWorkflow.getTaskId() : projectWorkflow.getEmailHistoryId());
        workflowStep.setInsertDate(now);
        workflowStep.setInsertedBy(projectWorkflow.getInsertedBy());
        workflowStep.setServiceWorkflowCategoryId(projectWorkflow.getServiceWorkflowCategoryId());

        projectWorkflowStepsRepository.save(workflowStep);

        // 将生成的ID设置回DTO
        projectWorkflow.setId(workflowStep.getId());
    }

    /**
     * 根据三元组(ProjectId, WorkflowId, WorkflowStepId)查找ProjectWorkflowSteps实体
     * 如果存在多个匹配的实体，返回最新插入的一个
     *
     * @param projectId 项目ID
     * @param workflowId 工作流ID
     * @param workflowStepId 工作流步骤ID
     * @return 匹配的ProjectWorkflowSteps实体，如果不存在则返回null
     */
    private ProjectWorkflowSteps findWorkflowStepByTriple(Integer projectId, Integer workflowId, Integer workflowStepId) {
        List<ProjectWorkflowSteps> steps = projectWorkflowStepsRepository
                .findByProjectIdAndWorkflowIdAndWorkflowStepId(projectId, workflowId, workflowStepId);

        if (steps == null || steps.isEmpty()) {
            return null;
        }

        // 返回最新插入的一个
        return steps.stream()
                .max(Comparator.comparing(ProjectWorkflowSteps::getInsertDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
    }

    private String generateUniqueFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isEmpty()) {
            return UUID.randomUUID().toString();
        }

        String extension = FilenameUtils.getExtension(originalFileName);
        return UUID.randomUUID() + "." + extension;
    }

    private String generateUniqueUrlKey() {
        int length = 16;
        String characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        SecureRandom random = new SecureRandom();
        StringBuilder result = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            result.append(characters.charAt(random.nextInt(characters.length())));
        }

        return result.toString();
    }

    private WrapperProjectWorkflowDto formatEmail(ProjectWorkflowDto projectWorkflow) {
        log.debug("Formatting email for template ID {} and project ID {}", projectWorkflow.getEmailTempId(), projectWorkflow.getProjectId());
        long startTime = System.currentTimeMillis();

        CompletableFuture<User> userFuture = CompletableFuture.supplyAsync(() -> userRepository.findById(projectWorkflow.getInsertedBy()).orElse(null));
        CompletableFuture<EmailTemplate> templateFuture = CompletableFuture.supplyAsync(() -> emailTemplateRepository.findById(projectWorkflow.getEmailTempId()).orElse(null));
        CompletableFuture<Project> projectFuture = CompletableFuture.supplyAsync(() -> projectRepository.findById(projectWorkflow.getProjectId()).orElse(null));
        CompletableFuture<GeneralSetting> settingFuture = CompletableFuture.supplyAsync(() -> generalSettingRepository.findFirstBy().orElse(null));
        CompletableFuture<List<no.nks.entity.ProjectService>> projectServicesFuture = CompletableFuture.supplyAsync(() -> projectServiceRepository.findByProjectId(projectWorkflow.getProjectId()));

        Project project = projectFuture.join();
        if (project == null) {
            throw new RuntimeException("Project not found for id: " + projectWorkflow.getProjectId());
        }

        CompletableFuture<ContactBook> customerFuture = CompletableFuture.supplyAsync(() -> contactRepository.findById(project.getCustomerId()).orElse(null));
        CompletableFuture<ContactBook> contactPersonFuture = CompletableFuture.supplyAsync(() -> contactRepository.findById(project.getContactPersonId()).orElse(null));
        CompletableFuture<ContactBook> projectLeaderFuture = (project.getProjectLeaderId() != null) ?
                CompletableFuture.supplyAsync(() -> contactRepository.findById(project.getProjectLeaderId()).orElse(null)) :
                CompletableFuture.completedFuture(null);
        CompletableFuture<BuildingSupplier> buildingSupplierFuture = CompletableFuture.supplyAsync(() -> buildingSupplierRepository.findById(project.getBuildingSupplierId()).orElse(null));

        CompletableFuture<PostNumber> postNumberFuture = (project.getPostNo() != null && !project.getPostNo().isEmpty()) ?
                CompletableFuture.supplyAsync(() -> postNumberRepository.findByPostnummer(Integer.valueOf(project.getPostNo())).orElse(null))
                : CompletableFuture.completedFuture(null);

        List<no.nks.entity.ProjectService> projectServices = projectServicesFuture.join();
        CompletableFuture<List<no.nks.entity.Service>> servicesFuture;
        if (projectServices != null && !projectServices.isEmpty()) {
            List<Integer> serviceIds = projectServices.stream().map(no.nks.entity.ProjectService::getServiceId).collect(Collectors.toList());
            servicesFuture = CompletableFuture.supplyAsync(() -> serviceRepository.findAllById(serviceIds));
        } else {
            servicesFuture = CompletableFuture.completedFuture(Collections.emptyList());
        }

        CompletableFuture.allOf(userFuture, templateFuture, settingFuture, customerFuture, contactPersonFuture, projectLeaderFuture, buildingSupplierFuture, postNumberFuture, servicesFuture).join();

        WorkflowDataBundle dataBundle = new WorkflowDataBundle();
        try {
            dataBundle.user = userFuture.get();
            dataBundle.template = templateFuture.get();
            dataBundle.project = project;
            dataBundle.generalSetting = settingFuture.get();
            dataBundle.customer = customerFuture.get();
            dataBundle.contactPerson = contactPersonFuture.get();
            dataBundle.projectLeader = projectLeaderFuture.get();
            dataBundle.buildingSupplier = buildingSupplierFuture.get();
            dataBundle.postNumber = postNumberFuture.get();
            dataBundle.services = servicesFuture.get();
        } catch (Exception e) {
            throw new RuntimeException("Failed to get future results", e);
        }

        if (dataBundle.template == null) {
            throw new RuntimeException("EmailTemplate not found for id: " + projectWorkflow.getEmailTempId());
        }

        WrapperProjectWorkflowDto wrapper = populateEmailFromData(projectWorkflow, dataBundle);

        long endTime = System.currentTimeMillis();
        log.debug("formatEmail for project {} took {} ms", projectWorkflow.getProjectId(), (endTime - startTime));

        return wrapper;
    }

    private static class WorkflowDataBundle {
        User user;
        EmailTemplate template;
        Project project;
        GeneralSetting generalSetting;
        ContactBook customer;
        ContactBook contactPerson;
        ContactBook projectLeader;
        BuildingSupplier buildingSupplier;
        PostNumber postNumber;
        List<no.nks.entity.Service> services;
    }

    private static String removeSpecialCharacters(String str) {
        if (str == null) {
            return "";
        }
        return str.replaceAll("[^a-zA-Z0-9\\s]", "");
    }

    @Override
    public RequestResponse projectWFGeneric(ProjectWorkflowDto projectWorkflow) {
        log.info("Processing generic project workflow, project: {}, step: {}",
                projectWorkflow.getProjectId(), projectWorkflow.getWorkflowStepId());

        RequestResponse result = new RequestResponse();

        try {
            boolean emailSent = emailService.sendEmail(
                    projectWorkflow.getToEmail(),
                    projectWorkflow.getEmailSubject(),
                    projectWorkflow.getEmailContent()
            );

            if (emailSent) {
                result.setSuccess(true);
                result.setMessage("Workflow processed successfully");
            } else {
                result.setSuccess(false);
                result.setMessage("Failed to send email for workflow");
            }
        } catch (Exception e) {
            log.error("Error processing workflow", e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }

        return result;
    }

    @Override
    public RequestResponse projectWFFive(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        // OPTIMIZATION NOTE: This endpoint is already highly optimized.
        // Its core logic is a simple and fast database write operation.
        // No further code optimization is necessary.
        return projectWFGenericStepSave(projectWorkflow);
    }

    @Override
    public RequestResponse projectWFSix(ProjectWorkflowDto projectWorkflow, Integer companyId) {
        // OPTIMIZATION NOTE: This endpoint is already highly optimized.
        // Its core logic is a simple and fast database write operation.
        // No further code optimization is necessary.
        return projectWFGenericStepSave(projectWorkflow);
    }

    @Override
    public void updateProjectFinalReportPdfDate(Integer projectId) {
        // This method was likely removed by mistake, restoring basic implementation
        projectService.updateProjectFinalReportPdfDate(projectId, null); // Pass null for companyId as it's not available here
    }

    @Override
    public void updateProjectInvoiceSetDate(Integer projectId) {
        // This method was likely removed by mistake, restoring basic implementation
        projectService.updateProjectInvoiceSetDate(projectId);
    }

    private String generatePdfForEmailFourteen(ProjectWorkflowDto projectWorkflow) throws Exception {
        log.info("Generating PDF for project workflow step 14, project: {}", projectWorkflow.getProjectId());
         Project project = projectRepository.findById(projectWorkflow.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found for id: " + projectWorkflow.getProjectId()));

        List<no.nks.entity.ProjectService> projectServices = projectServiceRepository.findByProjectId(project.getId());
        List<Integer> serviceIds = projectServices.stream().map(no.nks.entity.ProjectService::getServiceId).collect(Collectors.toList());
        List<no.nks.entity.Service> services = serviceRepository.findAllById(serviceIds);

        PostNumber postNumber = (project.getPostNo() != null && !project.getPostNo().isEmpty()) ?
                postNumberRepository.findByPostnummer(Integer.valueOf(project.getPostNo())).orElse(null) : null;

        GeneralSetting generalSetting = generalSettingRepository.findFirstBy().orElse(null);

        PdfService.PdfTemplateData pdfData = new PdfService.PdfTemplateData(
                project, services, postNumber, generalSetting
        );

        return pdfService.generatePdfForStepFourteen(projectWorkflow, pdfData);
    }

    @Override
    public WrapperProjectWorkflowDto getProjectWFFourteenEmailFormated(ProjectWorkflowDto projectWorkflow) throws Exception {
        log.info("Formatting email with PDF for project workflow step 14, project: {}", projectWorkflow.getProjectId());
        projectWorkflow.setEmailTempId(5); // Correct as per C# logic
        WrapperProjectWorkflowDto result = formatEmail(projectWorkflow);

        // 使用已有的方法生成PDF
        String pdfUrl = generatePdfForEmailFourteen(result.getProjectWorkflow());
        result.getProjectWorkflow().setAttachmentURL(pdfUrl);
        return result;
    }

    @Override
    public RequestResponse projectWFFourteen(ProjectWorkflowDto projectWorkflow, MultipartFile file, Integer companyId) {
        log.info("Processing project workflow step 14 with file, project: {}", projectWorkflow.getProjectId());
        RequestResponse result = new RequestResponse();
        try {
            if (Boolean.FALSE.equals(projectWorkflow.getIsTransfer())) {
                // Requirement check from C#
                List<Integer> requiredSteps = List.of(11, 12);
                long completedRequiredSteps = projectWorkflowStepsRepository.countByProjectIdAndWorkflowStepIdIn(projectWorkflow.getProjectId(), requiredSteps);
                if (completedRequiredSteps < requiredSteps.size()) {
                    result.setSuccess(false);
                    result.setMessage("Previous dependent steps are not completed yet.");
                    return result;
                }

                // Synchronously save status for immediate feedback
                saveWorkflowStepStatus(projectWorkflow);

                // Asynchronously perform heavy tasks
                byte[] fileBytes = (file != null && !file.isEmpty()) ? file.getBytes() : null;
                String originalFilename = (file != null) ? file.getOriginalFilename() : null;

                // Note: C# code for step 14 was calling step 13's background task by mistake.
                // We are creating a dedicated async task for step 14.
                projectWorkflowAsyncService.performStep14BackgroundTasks(projectWorkflow, fileBytes, originalFilename, companyId);

                result.setSuccess(true);
                result.setMessage("Workflow step 14 request accepted. Processing is underway in the background.");

            } else if (Boolean.TRUE.equals(projectWorkflow.getIsTransfer())) {
                saveWorkflowStepStatus(projectWorkflow);
                result.setSuccess(true);
                result.setMessage("Project status updated, Transfer successfully!");
            } else {
                result.setSuccess(false);
                result.setMessage("IsTransfer parameter is required!");
            }
        } catch (Exception e) {
            log.error("Error processing workflow step 14 for project {}", projectWorkflow.getProjectId(), e);
            result.setSuccess(false);
            result.setMessage("Error: " + e.getMessage());
        }
        return result;
    }

    // NEW private method for local status update
    private void completedTaskStatusSet(int projectId) {
        Project projectDetail = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        String currentStatus = projectDetail.getProjectStatus() != null ? projectDetail.getProjectStatus() : "";
        String statusToAdd = "13"; // Status for step 15 as per C# logic

        if (!Arrays.asList(currentStatus.split(",")).contains(statusToAdd)) {
            projectDetail.setProjectStatus(currentStatus + statusToAdd + ",");
        }

        projectDetail.setInvoiceSetCD(LocalDateTime.now());
        projectRepository.save(projectDetail);
        log.info("Updated project status for project {} to include step 15.", projectId);
    }

    private ProjectWorkflowDto convertToDto(ProjectWorkflowSteps workflowStep) {
        ProjectWorkflowDto dto = new ProjectWorkflowDto();
        // 仅当ID不为空时才设置ID
        if (workflowStep.getId() != null) {
            dto.setId(workflowStep.getId());
        }
        dto.setProjectId(workflowStep.getProjectId());
        dto.setWorkflowId(workflowStep.getWorkflowId());
        dto.setWorkflowStepId(workflowStep.getWorkflowStepId());
        dto.setIsTransfer(workflowStep.getIsTransfer());
        dto.setEmailHistoryId(workflowStep.getTaskId());
        dto.setInsertDate(workflowStep.getInsertDate());
        dto.setInsertedBy(workflowStep.getInsertedBy());
        dto.setServiceWorkflowCategoryId(workflowStep.getServiceWorkflowCategoryId());
        return dto;
    }
}
