package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.ProjectDocumentDto;
import no.nks.dto.ProjectDocumentUploadDto;
import no.nks.dto.RequestResponse;
import no.nks.dto.WrapperProjectDocumentDto;
import no.nks.dto.workflow.EmailProjectPartiesWorkflowDto;
import no.nks.dto.workflow.EmailProjectPartiesWorkflowEntDto;
import no.nks.dto.workflow.ProjectWorkflowDto;
import no.nks.dto.workflow.WrapperProjectWorkflowDto;
import no.nks.entity.ContactBook;
import no.nks.entity.Doc;
import no.nks.entity.DocType;
import no.nks.entity.EmailHistory;
import no.nks.entity.EmailTemplate;
import no.nks.entity.GeneralSetting;
import no.nks.entity.Project;
import no.nks.entity.ProjectParty;
import no.nks.entity.ProjectWorkflowSteps;
import no.nks.entity.PartyType;
import no.nks.repository.ContactBookRepository;
import no.nks.repository.DocRepository;
import no.nks.repository.DocTypeRepository;
import no.nks.repository.EmailHistoryRepository;
import no.nks.repository.EmailTemplateRepository;
import no.nks.repository.GeneralSettingRepository;
import no.nks.repository.ProjectPartyRepository;
import no.nks.repository.ProjectRepository;
import no.nks.repository.ProjectWorkflowStepsRepository;
import no.nks.service.IS3Service;
import no.nks.service.MailSenderService;
import no.nks.service.ProjectDocService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.Collections;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectDocServiceImpl implements ProjectDocService {

    // 数据库访问层
    private final IS3Service s3Service;
    private final ProjectRepository projectRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final GeneralSettingRepository generalSettingRepository;
    private final ProjectWorkflowStepsRepository projectWorkflowStepsRepository;
    private final ContactBookRepository contactBookRepository;
    private final EmailHistoryRepository emailHistoryRepository;
    private final MailSenderService mailSenderService;
    private final ProjectPartyRepository projectPartyRepository;
    private final DocTypeRepository docTypeRepository;
    private final DocRepository docRepository;

    @Override
    public WrapperProjectWorkflowDto getProjectInspThirPartyEmailFormated(ProjectWorkflowDto projectWorkflow, Integer companyId, Integer userId) {
        log.info("获取第三方检查邮件格式化内容，项目ID: {}, 工作流ID: {}", projectWorkflow.getProjectId(), projectWorkflow.getWorkflowId());

        try {
            // 设置ID和模板ID
            projectWorkflow.setId(0);
            projectWorkflow.setEmailTempId(8);

            // 设置必要的非null字段
            projectWorkflow.setWorkflowStepId(0);
            projectWorkflow.setIsTransfer(false);
            projectWorkflow.setInsertedBy(userId);
            projectWorkflow.setEmailContent("");
            projectWorkflow.setEmailSubject("");
            projectWorkflow.setEmailTo("");
            projectWorkflow.setEmailFrom("");

            // 重置insertDate为null
            projectWorkflow.setInsertDate(null);

            // 获取项目信息（仅用于生成文件名）
            Optional<Project> projectOpt = projectRepository.findProjectWithBasicInfo(projectWorkflow.getProjectId());
            if (!projectOpt.isPresent()) {
                log.error("项目不存在，ID: {}", projectWorkflow.getProjectId());
                return createBasicResponse(projectWorkflow);
            }

            Project project = projectOpt.get();

            // 动态生成文件名，去除空格和特殊字符
            String sanitizedTitle = "";
            if (project.getTitle() != null) {
                sanitizedTitle = project.getTitle()
                    .replace("-", "")
                    .replace(" ", "") // 去除空格
                    .replace("/", "") // 去除斜杠
                    .replace("\\", "") // 去除反斜杠
                    .replace(":", "") // 去除冒号
                    .replace("*", "") // 去除星号
                    .replace("?", "") // 去除问号
                    .replace("\"", "") // 去除双引号
                    .replace("<", "") // 去除小于号
                    .replace(">", "") // 去除大于号
                    .replace("|", ""); // 去除竖线
            }

            // 生成随机数后缀，1000-9999之间
            int randomSuffix = 1000 + (int)(Math.random() * 9000);

            // 格式: 项目ID + 处理后的标题 + -DevChecklists- + 随机数 + .pdf
            String fileName = project.getId() + sanitizedTitle + "-DevChecklists-" + randomSuffix + ".pdf";

            // 设置附件URL和文件名
            String attachmentUrl = generateAttachmentUrl(companyId, fileName);

            projectWorkflow.setAttachmentURL(attachmentUrl);
            projectWorkflow.setFileName(fileName);

            // 设置baseURLSite
            projectWorkflow.setBaseURLSite(projectWorkflow.getBaseURLSite());

            // 创建空的emailProjectParties
            if (projectWorkflow.getEmailProjectParties() == null) {
                projectWorkflow.setEmailProjectParties(new EmailProjectPartiesWorkflowDto());
                projectWorkflow.getEmailProjectParties().setEmailProjectPartiesWorkflowList(new ArrayList<>());
            }

            // 创建响应对象
            WrapperProjectWorkflowDto response = new WrapperProjectWorkflowDto();
            response.setProjectWorkflow(projectWorkflow);

            return response;
        } catch (Exception e) {
            log.error("获取第三方检查邮件格式化内容失败", e);
            return createBasicResponse(projectWorkflow);
        }
    }

    /**
     * 创建基本响应
     */
    private WrapperProjectWorkflowDto createBasicResponse(ProjectWorkflowDto projectWorkflow) {
        WrapperProjectWorkflowDto response = new WrapperProjectWorkflowDto();
        response.setProjectWorkflow(projectWorkflow);
        return response;
    }

    /**
     * 替换模板中的变量
     */
    private String replaceTemplateVariables(String template, Project project) {
        if (template == null) {
            return "";
        }

        // 替换项目相关变量
        template = template.replace("@ProjectTitle", project.getTitle() != null ? project.getTitle() : "");
        template = template.replace("@ProjectAddress", project.getAddress() != null ? project.getAddress() : "");
        template = template.replace("@ProjectPostNo", project.getPostNo() != null ? project.getPostNo() : "");
        template = template.replace("@ProjectPoststed", project.getPoststed() != null ? project.getPoststed() : "");

        // 获取客户信息
        if (project.getCustomerId() != null) {
            Optional<ContactBook> customerOpt = contactBookRepository.findById(project.getCustomerId());
            if (customerOpt.isPresent()) {
                ContactBook customer = customerOpt.get();
                template = template.replace("@CustomerName", customer.getName() != null ? customer.getName() : "");
                template = template.replace("@CustomerEmail", customer.getEmail() != null ? customer.getEmail() : "");
                template = template.replace("@CustomerPhone", customer.getContactNo() != null ? customer.getContactNo() : "");
            }
        }

        // 获取项目负责人信息
        if (project.getProjectLeaderId() != null) {
            Optional<ContactBook> leaderOpt = contactBookRepository.findById(project.getProjectLeaderId());
            if (leaderOpt.isPresent()) {
                ContactBook leader = leaderOpt.get();
                template = template.replace("@ProjectLeaderName", leader.getName() != null ? leader.getName() : "");
                template = template.replace("@ProjectLeaderEmail", leader.getEmail() != null ? leader.getEmail() : "");
                template = template.replace("@ProjectLeaderPhone", leader.getContactNo() != null ? leader.getContactNo() : "");
            }
        }

        return template;
    }

    /**
     * 生成附件URL
     */
    private String generateAttachmentUrl(Integer companyId, String fileName) {
        // 使用S3Service生成URL
        String bucketFolder = "CompanyID-" + companyId + "/DevChecklistPdfs/";
        return s3Service.createPublicURL(null, null, bucketFolder, fileName);
    }

    @Override
    public RequestResponse sendProjectInspThirPartyEmail(ProjectWorkflowDto projectWorkflow, MultipartFile file, Integer companyId, Integer userId) {
        log.debug("发送项目检查第三方邮件，项目ID: {}", projectWorkflow.getProjectId());

        try {
            // 基本验证
            if (projectWorkflow == null ||
                projectWorkflow.getEmailProjectParties() == null ||
                projectWorkflow.getEmailProjectParties().getEmailProjectPartiesWorkflowList() == null ||
                projectWorkflow.getEmailProjectParties().getEmailProjectPartiesWorkflowList().isEmpty()) {
                return RequestResponse.failure("Invalid email parameters");
            }

            if (file == null || file.isEmpty()) {
                return RequestResponse.failure("No attachment file provided");
            }

            // 过滤需要发送邮件的接收方
            List<EmailProjectPartiesWorkflowEntDto> emailRecipients = projectWorkflow.getEmailProjectParties()
                .getEmailProjectPartiesWorkflowList()
                .stream()
                .filter(partyEmail -> Boolean.TRUE.equals(partyEmail.getSendEmail()))
                .collect(Collectors.toList());

            if (emailRecipients.isEmpty()) {
                return RequestResponse.failure("No recipients selected for email sending");
            }

            // 记录邮件接收方数量
            int totalEmails = emailRecipients.size();
            log.debug("需要发送 {} 封邮件", totalEmails);

            // 异步处理所有邮件发送，不等待完成
            for (EmailProjectPartiesWorkflowEntDto partyEmail : emailRecipients) {
                // 生成唯一URL密钥
                String uniqueUrlKey = generateUniqueKey();

                // 构建URL参数
                String urlParams = String.format("?WorkflowId=%d&ProjectId=%d&PartyID=%d&PartyTypeID=%d&CKII=%s&UrlKey=%s",
                        projectWorkflow.getWorkflowId(),
                        projectWorkflow.getProjectId(),
                        partyEmail.getPartyID(),
                        partyEmail.getPartyTypeID(),
                        projectWorkflow.getChecklistItemIdCommaSeperated(),
                        uniqueUrlKey);

                // 替换链接内容
                String link = projectWorkflow.getBaseURLSite() + urlParams;
                String content = partyEmail.getContent().replace("@link", link);
                partyEmail.setContent(content);
                partyEmail.setUrlKey(uniqueUrlKey);

                // 异步发送邮件，不等待结果
                sendEmailToPartyAsync(
                    projectWorkflow.getProjectId(),
                    companyId,
                    partyEmail,
                    Set.of(projectWorkflow.getWorkflowId()),
                    file
                );
            }

            // 立即返回成功响应，不等待邮件实际发送完成
            log.info("已启动异步发送 {} 封邮件，项目ID: {}", totalEmails, projectWorkflow.getProjectId());
            return RequestResponse.success("Email sending process started for " + totalEmails + " recipients");

        } catch (Exception e) {
            log.error("启动邮件发送过程失败", e);
            return RequestResponse.failure("Failed to start email sending process: " + e.getMessage());
        }
    }

    @Override
    public WrapperProjectDocumentDto getProjectRequiredDocList(Integer projectId, Integer workflowId, Integer companyId) {
        log.debug("获取项目所需文档列表，项目ID: {}, 工作流ID: {}, 公司ID: {}", projectId, workflowId, companyId);

        WrapperProjectDocumentDto response = new WrapperProjectDocumentDto();
        response.setProjectId(projectId);
        response.setWorkflowId(workflowId);
        response.setWorkflowStepId(0); // 添加顶层workflowStepId
        List<ProjectDocumentDto> documentList = new ArrayList<>();

        try {
            // 获取项目所有的相关方
            List<ProjectParty> projectParties = projectPartyRepository.findByProjectIdWithPartyType(projectId);
            log.debug("找到项目相关方 {} 个", projectParties.size());

            // 遍历每个项目相关方
            for (ProjectParty party : projectParties) {
                Integer partyTypeId = party.getPartyTypeId();
                Integer partyId = party.getPartyId();
                Integer projectPartyId = party.getId();

                // 获取该相关方类型对应的所有文档类型
                List<DocType> docTypes = docTypeRepository.findByPartyTypeIdAndCompanyIdOrderBySortOrder(partyTypeId, companyId);
                log.debug("项目相关方ID: {}, 类型ID: {}, 找到文档类型 {} 个",
                        projectPartyId, partyTypeId, docTypes.size());

                // 获取该项目、该相关方上传的文档
                List<Doc> existingDocs = docRepository.findByProjectIdAndPartyIdAndPartyTypeId(projectId, partyId, partyTypeId);
                Map<Integer, Doc> docTypeMap = existingDocs.stream()
                    .collect(Collectors.toMap(Doc::getPartyDocTypeId, doc -> doc, (doc1, doc2) -> doc1));

                // 处理每个文档类型
                for (DocType docType : docTypes) {
                    ProjectDocumentDto docDto = new ProjectDocumentDto();

                    // 检查此类型的文档是否已上传
                    Doc existingDoc = docTypeMap.get(docType.getId());

                    if (existingDoc != null) {
                        // 已上传文档
                        docDto.setDocumentId(existingDoc.getId());
                        docDto.setPartyId(partyId);
                        docDto.setPartyTypeId(partyTypeId);
                        docDto.setDocumenTypeId(docType.getId());
                        docDto.setFileName(existingDoc.getFileName());
                        docDto.setDate(existingDoc.getDate());
                        docDto.setDocumentName(docType.getDocName());
                        docDto.setProjectPartyId(projectPartyId);
                        docDto.setIsApproved(existingDoc.getIsApproved());

                        // 如果有文件名，构建图片URL
                        if (existingDoc.getFileName() != null && !existingDoc.getFileName().isEmpty()) {
                            String imageUrl = s3Service.createPublicURL(
                                companyId.toString(),
                                "ProjectDocs",
                                projectId.toString(),
                                existingDoc.getFileName()
                            );
                            docDto.setImageUrl(imageUrl);
                        }

                        docDto.setWorkflowStepId(existingDoc.getWorkflowStepId());
                    } else {
                        // 未上传文档
                        docDto.setPartyId(partyId);
                        docDto.setPartyTypeId(partyTypeId);
                        docDto.setDocumenTypeId(docType.getId());
                        docDto.setDocumentName(docType.getDocName());
                        docDto.setProjectPartyId(projectPartyId);
                        docDto.setIsRequired(docType.getIsRequired()); // 添加必需标识
                        docDto.setIsApproved(null);
                        docDto.setDocumentId(null);
                        docDto.setWorkflowStepId(null);
                        docDto.setWorkflowStepName(null);
                        docDto.setDate(null);
                        docDto.setFileName(null);
                        docDto.setImageUrl(null);
                    }

                    // 添加到列表
                    documentList.add(docDto);
                }
            }

            response.setProjectDocumentList(documentList);
            log.debug("共返回 {} 个文档", documentList.size());

        } catch (Exception e) {
            log.error("获取项目文档列表时En feil oppstod", e);
            response.setProjectDocumentList(new ArrayList<>());
        }

        return response;
    }

    @Override
    public WrapperProjectDocumentDto getProjectRequiredDocBySingleParty(Integer projectId, Integer workflowId, Integer partyId, Integer partyTypeId, Integer companyId) {
        log.debug("获取单个参与方的项目文档列表，项目ID: {}, 工作流ID: {}, 参与方ID: {}, 参与方类型ID: {}, 公司ID: {}",
                projectId, workflowId, partyId, partyTypeId, companyId);

        WrapperProjectDocumentDto response = new WrapperProjectDocumentDto();
        response.setProjectId(projectId);
        response.setWorkflowId(workflowId);
        response.setWorkflowStepId(0); // 添加顶层workflowStepId，设置为0
        List<ProjectDocumentDto> documentList = new ArrayList<>();

        try {
            // 获取指定的项目参与方
            List<ProjectParty> projectParties = projectPartyRepository.findByProjectIdAndPartyTypeId(projectId, partyTypeId);
            if (projectParties.isEmpty()) {
                log.warn("未找到项目参与方，项目ID: {}, 参与方类型ID: {}", projectId, partyTypeId);
                response.setProjectDocumentList(documentList);
                return response;
            }

            // 如果提供了具体参与方ID，则过滤列表
            if (partyId != null) {
                projectParties = projectParties.stream()
                    .filter(pp -> partyId.equals(pp.getPartyId()))
                    .collect(Collectors.toList());

                if (projectParties.isEmpty()) {
                    log.warn("未找到指定参与方，项目ID: {}, 参与方ID: {}, 参与方类型ID: {}",
                            projectId, partyId, partyTypeId);
                    response.setProjectDocumentList(documentList);
                    return response;
                }
            }

            log.debug("找到项目参与方 {} 个", projectParties.size());

            // 获取该相关方类型对应的所有文档类型
            List<DocType> docTypes = docTypeRepository.findByPartyTypeIdAndCompanyIdOrderBySortOrder(partyTypeId, companyId);
            log.debug("参与方类型ID: {} 找到文档类型 {} 个", partyTypeId, docTypes.size());

            for (ProjectParty party : projectParties) {
                Integer projectPartyId = party.getId();

                // 获取该项目、该相关方上传的文档(同一 DocType 可多文件)
                List<Doc> existingDocs = docRepository.findByProjectIdAndPartyIdAndPartyTypeId(
                        projectId, party.getPartyId(), partyTypeId);
                Map<Integer, List<Doc>> docsByType = existingDocs.stream()
                        .filter(d -> d.getPartyDocTypeId() != null)
                        .collect(Collectors.groupingBy(Doc::getPartyDocTypeId));

                // 处理每个文档类型:已上传的每一份都返回一行;没有则返回占位行供上传
                for (DocType docType : docTypes) {
                    List<Doc> uploaded = docsByType.getOrDefault(docType.getId(), List.of());

                    if (uploaded.isEmpty()) {
                        ProjectDocumentDto docDto = new ProjectDocumentDto();
                        docDto.setPartyId(null);
                        docDto.setPartyTypeId(partyTypeId);
                        docDto.setDocumenTypeId(docType.getId());
                        docDto.setDocumentName(docType.getDocName());
                        docDto.setProjectPartyId(projectPartyId);
                        docDto.setIsRequired(docType.getIsRequired());
                        docDto.setIsApproved(null);
                        docDto.setDocumentId(null);
                        docDto.setWorkflowStepId(null);
                        docDto.setWorkflowStepName(null);
                        docDto.setDate(null);
                        docDto.setFileName(null);
                        docDto.setImageUrl(null);
                        documentList.add(docDto);
                        continue;
                    }

                    for (Doc existingDoc : uploaded) {
                        ProjectDocumentDto docDto = new ProjectDocumentDto();
                        docDto.setDocumentId(existingDoc.getId());
                        docDto.setPartyId(null);
                        docDto.setPartyTypeId(partyTypeId);
                        docDto.setDocumenTypeId(docType.getId());
                        docDto.setFileName(existingDoc.getFileName());
                        docDto.setDate(existingDoc.getDate());
                        docDto.setDocumentName(docType.getDocName());
                        docDto.setProjectPartyId(projectPartyId);
                        docDto.setIsApproved(existingDoc.getIsApproved());
                        docDto.setIsRequired(docType.getIsRequired());

                        if (existingDoc.getFileName() != null && !existingDoc.getFileName().isEmpty()) {
                            String imageUrl = s3Service.createPublicURL(
                                    companyId.toString(),
                                    "ProjectDocs",
                                    projectId.toString(),
                                    existingDoc.getFileName());
                            docDto.setImageUrl(imageUrl);
                        }

                        docDto.setWorkflowStepId(existingDoc.getWorkflowStepId());
                        documentList.add(docDto);
                    }
                }

                // 无 DocType 的参与方级「Other」附件也一并返回(可多文件)
                List<Doc> otherUploads = existingDocs.stream()
                        .filter(d -> d.getPartyDocTypeId() == null)
                        .collect(Collectors.toList());
                for (Doc existingDoc : otherUploads) {
                    ProjectDocumentDto docDto = new ProjectDocumentDto();
                    docDto.setDocumentId(existingDoc.getId());
                    docDto.setPartyId(null);
                    docDto.setPartyTypeId(partyTypeId);
                    docDto.setDocumenTypeId(null);
                    docDto.setFileName(existingDoc.getFileName());
                    docDto.setDate(existingDoc.getDate());
                    docDto.setDocumentName("Other");
                    docDto.setProjectPartyId(projectPartyId);
                    docDto.setIsApproved(existingDoc.getIsApproved());
                    if (existingDoc.getFileName() != null && !existingDoc.getFileName().isEmpty()) {
                        String imageUrl = s3Service.createPublicURL(
                                companyId.toString(),
                                "ProjectDocs",
                                projectId.toString(),
                                existingDoc.getFileName());
                        docDto.setImageUrl(imageUrl);
                    }
                    docDto.setWorkflowStepId(existingDoc.getWorkflowStepId());
                    documentList.add(docDto);
                }
            }

            response.setProjectDocumentList(documentList);
            log.debug("共返回 {} 个文档", documentList.size());

        } catch (Exception e) {
            log.error("获取单个参与方的项目文档列表时En feil oppstod", e);
            response.setProjectDocumentList(new ArrayList<>());
        }

        return response;
    }

    @Override
    public WrapperProjectDocumentDto getProjectApprovalRequiredDocList(Integer projectId, Integer workflowId, Integer companyId) {
        log.debug("获取需要审批的项目文档列表，项目ID: {}, 工作流ID: {}, 公司ID: {}", projectId, workflowId, companyId);

        WrapperProjectDocumentDto response = new WrapperProjectDocumentDto();
        response.setProjectId(projectId);
        response.setWorkflowId(workflowId);
        response.setWorkflowStepId(0); // 设置顶层workflowStepId
        List<ProjectDocumentDto> documentList = new ArrayList<>();

        try {
            // 检查项目是否存在
            Optional<Project> projectOpt = projectRepository.findById(projectId);
            if (!projectOpt.isPresent()) {
                log.warn("项目不存在，ID: {}", projectId);
                response.setProjectDocumentList(documentList);
                return response;
            }

            // 获取项目所有参与方
            List<ProjectParty> projectParties = projectPartyRepository.findByProjectId(projectId);
            log.debug("找到项目参与方 {} 个", projectParties.size());

            // 遍历每个参与方，收集需要审批的文档
            for (ProjectParty party : projectParties) {
                Integer partyTypeId = party.getPartyTypeId();
                Integer partyId = party.getPartyId();
                Integer projectPartyId = party.getId();

                // 如果参与方类型ID为空，尝试从联系人信息获取
                if (partyTypeId == null || partyTypeId == 0) {
                    if (partyId != null) {
                        Optional<ContactBook> contactOpt = contactBookRepository.findById(partyId);
                        if (contactOpt.isPresent()) {
                            ContactBook contact = contactOpt.get();
                            if (contact.getPartyTypeId() != null) {
                                partyTypeId = contact.getPartyTypeId();
                            }
                        }
                    }

                    // 如果仍然无法获取参与方类型ID，跳过此参与方
                    if (partyTypeId == null || partyTypeId == 0) {
                        log.warn("无法确定参与方类型，跳过参与方。项目ID: {}, 参与方ID: {}", projectId, partyId);
                        continue;
                    }
                }

                // 获取该参与方需要审批的文档列表
                List<ProjectDocumentDto> partyDocuments = getProjectApprovedRequiredDocList(
                        projectId, partyTypeId, partyId, projectPartyId, companyId);

                // 为文档生成URL
                for (ProjectDocumentDto doc : partyDocuments) {
                    if (doc.getFileName() != null && !doc.getFileName().isEmpty()) {
                        String imageUrl = s3Service.createPublicURL(
                                companyId.toString(),
                                "ProjectDocs",
                                projectId.toString(),
                                doc.getFileName());
                        doc.setImageUrl(imageUrl);
                    }
                }

                // 添加到总列表
                documentList.addAll(partyDocuments);
            }

            response.setProjectDocumentList(documentList);
            log.debug("共返回需要审批的文档 {} 个", documentList.size());

        } catch (Exception e) {
            log.error("获取需要审批的项目文档列表时En feil oppstod", e);
            response.setProjectDocumentList(new ArrayList<>());
        }

        return response;
    }

    /**
     * 获取单个参与方需要审批的文档列表
     *
     * @param projectId 项目ID
     * @param partyTypeId 参与方类型ID
     * @param partyId 参与方ID
     * @param projectPartyId 项目参与方ID
     * @param companyId 公司ID
     * @return 文档列表
     */
    private List<ProjectDocumentDto> getProjectApprovedRequiredDocList(
            Integer projectId, Integer partyTypeId, Integer partyId, Integer projectPartyId, Integer companyId) {

        List<ProjectDocumentDto> documentList = new ArrayList<>();

        try {
            // 获取该参与方类型的所有文档类型
            List<DocType> docTypes = docTypeRepository.findByPartyTypeIdAndCompanyIdOrderBySortOrder(partyTypeId, companyId);

            // 获取该参与方已上传的文档
            List<Doc> existingDocs = docRepository.findByProjectIdAndPartyIdAndPartyTypeId(projectId, partyId, partyTypeId);

            // 创建映射，便于查找
            Map<Integer, Doc> docTypeMap = existingDocs.stream()
                    .collect(Collectors.toMap(Doc::getPartyDocTypeId, doc -> doc, (doc1, doc2) -> doc1));

            // 处理每个文档类型，只选择需要审批的文档（isApproved不为null）
            for (DocType docType : docTypes) {
                Doc existingDoc = docTypeMap.get(docType.getId());

                // 只添加已上传但未审批的文档（isApproved存在但为false）
                if (existingDoc != null && existingDoc.getIsApproved() != null && !existingDoc.getIsApproved()) {
                    ProjectDocumentDto docDto = new ProjectDocumentDto();
                    docDto.setDocumentId(existingDoc.getId());
                    docDto.setPartyId(partyId);
                    docDto.setPartyTypeId(partyTypeId);
                    docDto.setDocumenTypeId(docType.getId());
                    docDto.setFileName(existingDoc.getFileName());
                    docDto.setDate(existingDoc.getDate());
                    docDto.setDocumentName(docType.getDocName());
                    docDto.setProjectPartyId(projectPartyId);
                    docDto.setIsApproved(existingDoc.getIsApproved());
                    docDto.setWorkflowStepId(existingDoc.getWorkflowStepId());

                    documentList.add(docDto);
                }
            }

        } catch (Exception e) {
            log.error("获取参与方需要审批的文档列表时En feil oppstod，项目ID: {}, 参与方类型ID: {}, 参与方ID: {}",
                    projectId, partyTypeId, partyId, e);
        }

        return documentList;
    }

    @Override
    public RequestResponse uploadProjectDocument(ProjectDocumentUploadDto uploadDto, MultipartFile file, Integer companyId, Integer userId) {
        log.debug("上传项目文档，项目ID: {}, 公司ID: {}", uploadDto.getProjectId(), companyId);

        try {
            // 基本验证
            if (file == null || file.isEmpty()) {
                return RequestResponse.failure("No file provided");
            }

            // 获取项目信息
            Optional<Project> projectOpt = projectRepository.findById(uploadDto.getProjectId());
            if (projectOpt.isEmpty()) {
                return RequestResponse.failure("Project not found");
            }

            Project project = projectOpt.get();

            // 处理项目标题并生成文件名
            String processedTitle = removeSpecialCharacters(project.getTitle());
            String fileName = processedTitle + file.getOriginalFilename();

            // 获取S3存储桶文件夹
            String bucketFolder = "CompanyID-" + companyId + "/ProjectDocs/" + uploadDto.getProjectId() + "/";

            // 先创建数据库记录
            Doc doc = new Doc();
            doc.setProjectId(uploadDto.getProjectId());
            doc.setPartyId(uploadDto.getPartyId());
            doc.setPartyTypeId(uploadDto.getPartyTypeId());
            doc.setPartyDocTypeId(uploadDto.getDocumenTypeId());
            doc.setFileName(fileName);
            doc.setDate(LocalDateTime.now());
            doc.setIsApproved(false);
            doc.setWorkflowId(uploadDto.getWorkflowId());
            doc.setWorkflowStepId(0);
            doc.setCompanyId(companyId);
            // Andre 通用附件等依赖此字段;旧实现漏写导致列表永远查不到。
            doc.setOtherDocs(uploadDto.getOtherDocs());

            // 保存数据库记录
            Doc savedDoc = docRepository.save(doc);

            // 异步处理文件上传，不等待完成
            processFileUploadAsync(bucketFolder, file, fileName, savedDoc);

            // 创建响应对象
            Map<String, Object> additionalData = new HashMap<>();
            additionalData.put("fileName", fileName);
            additionalData.put("documentId", savedDoc.getId());

            RequestResponse response = RequestResponse.success("Document uploaded successfully!");
            // 如果RequestResponse有设置附加数据的方法，取消下面的注释
            // response.setData(additionalData);

            return response;
        } catch (Exception e) {
            log.error("上传文档过程中En feil oppstod", e);
            return RequestResponse.failure("Failed to upload document: " + e.getMessage());
        }
    }

    /**
     * 移除特殊字符，用于生成文件名
     * @param input 输入字符串
     * @return 处理后的字符串
     */
    private String removeSpecialCharacters(String input) {
        if (input == null || input.isEmpty()) {
            return "";
        }

        // 移除常见的特殊字符
        return input.replaceAll("[\\s-/\\\\:*?\"<>|]", "");
    }

    @Override
    public WrapperProjectDocumentDto getProjectSystemGeneratedDocListAllSteps(Integer projectId, Integer workflowId, Integer companyId) {
        log.debug("获取项目系统生成的文档列表，项目ID: {}, 工作流ID: {}, 公司ID: {}", projectId, workflowId, companyId);

        try {
            // 创建响应对象
            WrapperProjectDocumentDto response = new WrapperProjectDocumentDto();
            response.setProjectId(projectId);
            response.setWorkflowId(workflowId);
            response.setWorkflowStepId(0); // 设置默认值

            // 创建文档列表
            List<ProjectDocumentDto> documentList = new ArrayList<>();

            // 查询项目信息
            Optional<Project> projectOpt = projectRepository.findById(projectId);
            if (projectOpt.isEmpty()) {
                log.warn("项目不存在，ID: {}", projectId);
                response.setProjectDocumentList(documentList);
                return response;
            }

            Project project = projectOpt.get();

            // 1. 查询步骤2的文档（Soknad Om Ansvarsrett）
            EmailHistory soknadAnsvarsrettEmail = findSystemGeneratedEmailByStepId(projectId, workflowId, 2);
            if (soknadAnsvarsrettEmail != null) {
                ProjectDocumentDto docDto = convertToDocumentDto(soknadAnsvarsrettEmail, null);
                docDto.setWorkflowStepId(2);

                // 获取步骤名称
                setWorkflowStepName(docDto);

                // 设置S3链接
                String s3Url = s3Service.createPublicURL(null, null,
                        "CompanyID-" + companyId + "/Files/", docDto.getFileName());
                docDto.setImageUrl(s3Url);

                documentList.add(docDto);
            }

            // 2. 查询步骤3的文档（Ansvarlig Soker）
            List<Doc> ansvarligPdfDocs = findAnsvarligPdfDocuments(projectId, workflowId);
            for (Doc doc : ansvarligPdfDocs) {
                ProjectDocumentDto docDto = convertToDocumentDto(null, doc);
                docDto.setWorkflowStepId(3);

                // 获取步骤名称
                setWorkflowStepName(docDto);

                // 设置S3链接
                String s3Url = s3Service.createPublicURL(null, null,
                        "CompanyID-" + companyId + "/Files/", docDto.getFileName());
                docDto.setImageUrl(s3Url);

                documentList.add(docDto);
            }

            // 3. 查询步骤13的文档（Kontrollerklaering）
            EmailHistory kontrollerklaeringEmail = findSystemGeneratedEmailByStepId(projectId, workflowId, 13);
            if (kontrollerklaeringEmail != null) {
                ProjectDocumentDto docDto = convertToDocumentDto(kontrollerklaeringEmail, null);
                docDto.setWorkflowStepId(13);

                // 获取步骤名称
                setWorkflowStepName(docDto);

                // 设置S3链接
                String s3Url = s3Service.createPublicURL(null, null,
                        "CompanyID-" + companyId + "/Files/", docDto.getFileName());
                docDto.setImageUrl(s3Url);

                documentList.add(docDto);
            }

            // 4. 查询步骤14的文档（Final Report）
            EmailHistory finalReportEmail = findFinalReportEmailByProjectId(projectId, workflowId);
            if (finalReportEmail != null) {
                ProjectDocumentDto docDto = convertToDocumentDto(finalReportEmail, null);
                docDto.setWorkflowStepId(14);

                // 获取步骤名称
                setWorkflowStepName(docDto);

                // 设置S3链接
                String s3Url = s3Service.createPublicURL(null, null,
                        "CompanyID-" + companyId + "/Files/", docDto.getFileName());
                docDto.setImageUrl(s3Url);

                documentList.add(docDto);
            }

            // 设置响应
            response.setProjectDocumentList(documentList);
            log.debug("找到 {} 个系统生成的文档", documentList.size());
            return response;
        } catch (Exception e) {
            log.error("获取系统生成的文档列表时En feil oppstod", e);
            // En feil oppstod时返回空列表
            WrapperProjectDocumentDto response = new WrapperProjectDocumentDto();
            response.setProjectId(projectId);
            response.setWorkflowId(workflowId);
            response.setProjectDocumentList(new ArrayList<>());
            return response;
        }
    }

    @Override
    public WrapperProjectDocumentDto getProjectOtherDocList(Integer projectId, Integer workflowId, Integer companyId) {
        log.debug("获取 Andre 通用附件列表，项目ID: {}, 工作流ID: {}, 公司ID: {}", projectId, workflowId, companyId);

        WrapperProjectDocumentDto response = new WrapperProjectDocumentDto();
        response.setProjectId(projectId);
        response.setWorkflowId(workflowId);
        response.setWorkflowStepId(0);
        List<ProjectDocumentDto> documentList = new ArrayList<>();

        try {
            List<Doc> byFlag = docRepository.findByProjectIdAndWorkflowIdAndOtherDocs(projectId, workflowId, 2);
            // 兼容:历史上上传漏写 OtherDocs 时,无参与方/无文档类型的行也算 Andre。
            List<Doc> byOrphan = docRepository.findByProjectIdAndWorkflowId(projectId, workflowId).stream()
                    .filter(d -> d.getOtherDocs() == null
                            && d.getPartyId() == null
                            && d.getPartyTypeId() == null
                            && d.getPartyDocTypeId() == null)
                    .collect(Collectors.toList());

            java.util.LinkedHashMap<Integer, Doc> merged = new java.util.LinkedHashMap<>();
            for (Doc d : byFlag) {
                if (d.getId() != null) merged.put(d.getId(), d);
            }
            for (Doc d : byOrphan) {
                if (d.getId() != null) merged.putIfAbsent(d.getId(), d);
            }

            for (Doc existingDoc : merged.values()) {
                ProjectDocumentDto docDto = new ProjectDocumentDto();
                docDto.setDocumentId(existingDoc.getId());
                docDto.setFileName(existingDoc.getFileName());
                docDto.setDate(existingDoc.getDate());
                docDto.setDocumentName(existingDoc.getFileName());
                docDto.setIsApproved(existingDoc.getIsApproved());
                docDto.setWorkflowStepId(existingDoc.getWorkflowStepId());
                if (existingDoc.getFileName() != null && !existingDoc.getFileName().isEmpty()) {
                    String imageUrl = s3Service.createPublicURL(
                            companyId.toString(),
                            "ProjectDocs",
                            projectId.toString(),
                            existingDoc.getFileName());
                    docDto.setImageUrl(imageUrl);
                }
                documentList.add(docDto);
            }

            response.setProjectDocumentList(documentList);
            log.debug("Andre 共返回 {} 个文档", documentList.size());
        } catch (Exception e) {
            log.error("获取 Andre 通用附件列表时En feil oppstod", e);
            response.setProjectDocumentList(new ArrayList<>());
        }

        return response;
    }

    @Override
    public RequestResponse deleteProjectDocument(Integer documentId, Integer projectId, Integer companyId) {
        try {
            // 检查文档是否存在，并验证所属项目和公司
            Optional<Doc> docOpt = docRepository.findById(documentId);
            if (docOpt.isEmpty()) {
                return RequestResponse.failure("Document not found");
            }

            Doc doc = docOpt.get();

            // 快速验证：仅在ID不匹配时才返回错误
            if (!projectId.equals(doc.getProjectId())) {
                return RequestResponse.failure("Document does not belong to the specified project");
            }

            if (companyId != null && doc.getCompanyId() != null && !companyId.equals(doc.getCompanyId())) {
                return RequestResponse.failure("Document does not belong to the specified company");
            }

            // 先删除数据库记录确保API快速响应
            docRepository.delete(doc);

            // 如果有关联文件，异步删除S3文件
            if (StringUtils.hasText(doc.getFileName())) {
                String bucketFolder = "CompanyID-" + companyId + "/ProjectDocs/" + projectId + "/";
                String fileName = doc.getFileName();
                // 异步删除S3文件，不等待结果
                deleteFileFromS3Async(bucketFolder, fileName);
            }

            return RequestResponse.success("Document deleted successfully");
        } catch (Exception e) {
            log.error("删除文档失败，ID: {}", documentId, e);
            return RequestResponse.failure("Failed to delete document: " + e.getMessage());
        }
    }

    /**
     * 发送邮件给特定的项目相关方（无附件）
     * 注: 为了兼容性保留此方法，新代码应使用异步版本
     */
    private boolean sendEmailToParty(int projectId, Integer companyId, EmailProjectPartiesWorkflowEntDto emailData, Set<Integer> workflowIdSet) {
        return sendEmailToParty(projectId, companyId, emailData, workflowIdSet, null);
    }

    /**
     * 发送邮件给特定的项目相关方（带附件）
     * 注: 为了兼容性保留此方法，新代码应使用异步版本
     */
    private boolean sendEmailToParty(int projectId, Integer companyId, EmailProjectPartiesWorkflowEntDto emailData, Set<Integer> workflowIdSet, MultipartFile file) {
        try {
            // 使用异步方法，但等待结果
            return sendEmailToPartyAsync(projectId, companyId, emailData, workflowIdSet, file).get();
        } catch (Exception e) {
            log.error("发送邮件失败", e);
            return false;
        }
    }

    /**
     * 查询特定步骤的系统生成邮件记录
     *
     * @param projectId 项目ID
     * @param workflowId 工作流ID
     * @param workflowStepId 工作流步骤ID
     * @return 匹配的邮件历史记录，如果没有找到则返回null
     */
    private EmailHistory findSystemGeneratedEmailByStepId(Integer projectId, Integer workflowId, Integer workflowStepId) {
        log.debug("查询项目ID: {}, 工作流ID: {}, 步骤ID: {} 的系统生成邮件", projectId, workflowId, workflowStepId);

        // 查询邮件记录，按ID降序排列，获取最新的记录
        List<EmailHistory> emails = emailHistoryRepository.findByProjectIdAndWorkflowIdAndWorkflowStepId(
                projectId, workflowId, workflowStepId);

        if (emails == null || emails.isEmpty()) {
            log.debug("未找到匹配的邮件记录");
            return null;
        }

        // 返回最新的记录
        EmailHistory latestEmail = emails.stream()
                .sorted(Comparator.comparing(EmailHistory::getId).reversed())
                .findFirst()
                .orElse(null);

        if (latestEmail != null && !StringUtils.hasText(latestEmail.getFileName())) {
            log.debug("找到了邮件记录，但没有关联文件");
            return null;
        }

        log.debug("找到匹配的邮件记录，ID: {}, 文件名: {}",
                latestEmail != null ? latestEmail.getId() : null,
                latestEmail != null ? latestEmail.getFileName() : null);

        return latestEmail;
    }

    /**
     * 查询项目AnsvarligSoker PDF文档
     *
     * @param projectId 项目ID
     * @param workflowId 工作流ID
     * @return 匹配的文档列表
     */
    private List<Doc> findAnsvarligPdfDocuments(Integer projectId, Integer workflowId) {
        log.debug("查询项目ID: {}, 工作流ID: {} 的AnsvarligSoker文档", projectId, workflowId);

        // 查找包含"AnsvarligSokerFile"的文档，OtherDocs=3
        List<Doc> docs = docRepository.findByProjectIdAndWorkflowId(projectId, workflowId);

        if (docs == null || docs.isEmpty()) {
            log.debug("未找到任何文档");
            return Collections.emptyList();
        }

        // 过滤OtherDocs=3且文件名包含"AnsvarligSokerFile"的文档
        List<Doc> filteredDocs = docs.stream()
                .filter(doc -> doc.getOtherDocs() != null && doc.getOtherDocs() == 3)
                .filter(doc -> doc.getFileName() != null && doc.getFileName().contains("AnsvarligSokerFile"))
                .collect(Collectors.toList());

        log.debug("找到 {} 个AnsvarligSoker文档", filteredDocs.size());

        return filteredDocs;
    }

    /**
     * 查询项目最终报告邮件
     *
     * @param projectId 项目ID
     * @param workflowId 工作流ID
     * @return 匹配的邮件历史记录，如果没有找到则返回null
     */
    private EmailHistory findFinalReportEmailByProjectId(Integer projectId, Integer workflowId) {
        log.debug("查询项目ID: {}, 工作流ID: {} 的最终报告邮件", projectId, workflowId);

        // 查询步骤14的邮件记录
        List<EmailHistory> emails = emailHistoryRepository.findByProjectIdAndWorkflowIdAndWorkflowStepId(
                projectId, workflowId, 14);

        if (emails == null || emails.isEmpty()) {
            log.debug("未找到匹配的邮件记录");
            return null;
        }

        // 过滤文件名包含"FinalReport"的邮件，并按ID降序排列获取最新的记录
        EmailHistory finalReportEmail = emails.stream()
                .filter(email -> email.getFileName() != null && email.getFileName().contains("FinalReport"))
                .sorted(Comparator.comparing(EmailHistory::getId).reversed())
                .findFirst()
                .orElse(null);

        log.debug("找到最终报告邮件: {}", finalReportEmail != null ? finalReportEmail.getFileName() : "未找到");

        return finalReportEmail;
    }

    /**
     * 将EmailHistory或Doc实体转换为ProjectDocumentDto
     *
     * @param emailHistory 邮件历史记录，可以为null
     * @param doc 文档实体，可以为null
     * @return 转换后的ProjectDocumentDto对象
     */
    private ProjectDocumentDto convertToDocumentDto(EmailHistory emailHistory, Doc doc) {
        ProjectDocumentDto dto = new ProjectDocumentDto();

        if (emailHistory != null) {
            dto.setWorkflowStepId(emailHistory.getWorkflowStepId());
            dto.setFileName(emailHistory.getFileName());
            dto.setDate(emailHistory.getDate());
        } else if (doc != null) {
            dto.setDocumentId(doc.getId());
            dto.setPartyId(doc.getPartyId());
            dto.setPartyTypeId(doc.getPartyTypeId());
            dto.setDocumenTypeId(doc.getPartyDocTypeId());
            dto.setFileName(doc.getFileName());
            dto.setDate(doc.getDate());
            dto.setIsApproved(doc.getIsApproved());
        }

        return dto;
    }

    /**
     * 设置工作流步骤名称
     *
     * @param documentDto 文档DTO对象
     */
    private void setWorkflowStepName(ProjectDocumentDto documentDto) {
        if (documentDto == null || documentDto.getWorkflowStepId() == null) {
            return;
        }

        // 根据工作流步骤ID设置步骤名称
        switch (documentDto.getWorkflowStepId()) {
            case 2:
                documentDto.setWorkflowStepName("Opprett og send: Erklæring om ansvarsrett");
                break;
            case 3:
                documentDto.setWorkflowStepName("Ansvarlig søker");
                break;
            case 13:
                documentDto.setWorkflowStepName("Kontrollerklæring PDF");
                break;
            case 14:
                documentDto.setWorkflowStepName("Final Rapport PDF");
                break;
            default:
                documentDto.setWorkflowStepName("Step " + documentDto.getWorkflowStepId());
                break;
        }
    }

    /**
     * 异步删除S3存储中的文件
     *
     * @param bucketFolder 存储桶文件夹
     * @param fileName 文件名
     * @return CompletableFuture<Boolean> 异步操作结果
     */
    @Async
    protected CompletableFuture<Boolean> deleteFileFromS3Async(String bucketFolder, String fileName) {
        try {
            boolean result = s3Service.deleteFile(bucketFolder, fileName);
            if (!result) {
                log.debug("无法从S3删除文件，文件名: {}", fileName);
            } else {
                log.debug("异步成功删除S3文件: {}", fileName);
            }
            return CompletableFuture.completedFuture(result);
        } catch (Exception e) {
            log.error("异步删除S3文件时En feil oppstod: {}", fileName, e);
            return CompletableFuture.completedFuture(false);
        }
    }

    /**
     * 异步处理文件上传
     *
     * @param bucketFolder S3存储桶文件夹
     * @param file 要上传的文件
     * @param fileName 文件名
     * @param doc 已保存的文档实体
     * @return CompletableFuture<Boolean> 异步操作结果
     */
    @Async
    protected CompletableFuture<Boolean> processFileUploadAsync(String bucketFolder, MultipartFile file, String fileName, Doc doc) {
        try {
            // 异步上传文件到S3
            String uploadResult = s3Service.uploadFileAsync(bucketFolder, file, fileName).get();

            if (!"Success".equals(uploadResult)) {
                log.error("异步上传文件到S3失败：{}", uploadResult);
                // 如果上传失败，删除之前创建的数据库记录
                docRepository.delete(doc);
                return CompletableFuture.completedFuture(false);
            }

            log.debug("异步文件上传成功: {}", fileName);
            return CompletableFuture.completedFuture(true);
        } catch (Exception e) {
            log.error("异步处理文件上传时En feil oppstod", e);
            // 如果上传失败，删除之前创建的数据库记录
            docRepository.delete(doc);
            return CompletableFuture.completedFuture(false);
        }
    }

    /**
     * 异步发送邮件给特定的项目相关方
     *
     * @param projectId 项目ID
     * @param companyId 公司ID
     * @param emailData 邮件数据
     * @param workflowIdSet 工作流ID集合
     * @param file 附件文件（可选）
     * @return 异步操作结果
     */
    @Async
    protected CompletableFuture<Boolean> sendEmailToPartyAsync(
            int projectId,
            Integer companyId,
            EmailProjectPartiesWorkflowEntDto emailData,
            Set<Integer> workflowIdSet,
            MultipartFile file) {

        try {
            // 获取邮件发送器和发件人信息
            JavaMailSender mailSender;
            String senderEmail;
            String senderDisplayName;

            try {
                // 尝试使用公司特定的邮件配置
                mailSender = mailSenderService.getJavaMailSender(companyId);
                senderEmail = mailSenderService.getSenderEmail(companyId);
                senderDisplayName = mailSenderService.getSenderDisplayName(companyId);
            } catch (Exception e) {
                log.error("获取邮件发送器失败，项目ID: {}, 公司ID: {}", projectId, companyId, e);
                return CompletableFuture.completedFuture(false);
            }

            // 验证邮箱格式
            if (emailData.getEmailTo() == null || !isValidEmail(emailData.getEmailTo()) || !isValidEmail(senderEmail)) {
                log.error("无效的邮箱格式，收件人: {}, 发件人: {}", emailData.getEmailTo(), senderEmail);
                return CompletableFuture.completedFuture(false);
            }

            // 准备邮件消息
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(emailData.getEmailTo());
            helper.setSubject(emailData.getTitle());
            helper.setFrom(senderEmail, senderDisplayName);
            helper.setText(emailData.getContent(), true);

            // 添加附件
            if (file != null && !file.isEmpty()) {
                helper.addAttachment(file.getOriginalFilename(), new ByteArrayResource(file.getBytes()));
            }

            // 发送邮件
            try {
                mailSender.send(message);
                log.info("异步邮件成功发送，收件人: {}", emailData.getEmailTo());

                // 若发送成功且有PartyID，保存邮件历史记录
                if (emailData.getPartyID() != null) {
                    // 创建ProjectWorkflowDto对象以适配saveEmailHistory方法
                    ProjectWorkflowDto workflowDto = new ProjectWorkflowDto();
                    workflowDto.setProjectId(projectId);
                    workflowDto.setWorkflowId(workflowIdSet.iterator().next());

                    // 保存邮件历史
                    String uniqueUrlKey = emailData.getUrlKey() != null ? emailData.getUrlKey() : generateUniqueKey();
                    saveEmailHistory(workflowDto, emailData, uniqueUrlKey, companyId);
                }

                return CompletableFuture.completedFuture(true);
            } catch (Exception e) {
                log.error("异步发送邮件失败，收件人: {}", emailData.getEmailTo(), e);
                return CompletableFuture.completedFuture(false);
            }
        } catch (Exception e) {
            log.error("异步邮件发送过程中发生未预期的异常", e);
            return CompletableFuture.completedFuture(false);
        }
    }

    /**
     * 验证邮箱格式
     * @param email 待验证的邮箱地址
     * @return 是否是有效邮箱地址
     */
    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        // 简单的电子邮件格式验证
        String regex = "^[A-Za-z0-9+_.-]+@(.+)$";
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(email);
        return matcher.matches();
    }

    /**
     * 生成唯一的URL密钥
     */
    private String generateUniqueKey() {
        int keyLength = 16;
        String characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        StringBuilder result = new StringBuilder(keyLength);

        SecureRandom random = new SecureRandom();
        for (int i = 0; i < keyLength; i++) {
            int randomIndex = random.nextInt(characters.length());
            result.append(characters.charAt(randomIndex));
        }

        return result.toString();
    }

    /**
     * 保存邮件历史记录
     */
    private void saveEmailHistory(ProjectWorkflowDto projectWorkflow,
                                 EmailProjectPartiesWorkflowEntDto partyEmail,
                                 String uniqueUrlKey,
                                 Integer companyId) {
        try {
            EmailHistory emailHistory = new EmailHistory();
            emailHistory.setProjectId(projectWorkflow.getProjectId());
            emailHistory.setWorkflowId(projectWorkflow.getWorkflowId());
            emailHistory.setWorkflowStepId(projectWorkflow.getWorkflowStepId());
            emailHistory.setSubject(partyEmail.getTitle());
            emailHistory.setToEmail(partyEmail.getEmailTo());
            emailHistory.setFromEmail(partyEmail.getEmailFrom());
            emailHistory.setMessage(partyEmail.getContent());
            emailHistory.setFileName(projectWorkflow.getFileName());
            emailHistory.setDate(LocalDateTime.now());
            emailHistory.setPartyTypeId(partyEmail.getPartyTypeID());
            emailHistory.setIsEmail(true);
            emailHistory.setPartyId(partyEmail.getPartyID());
            emailHistory.setUrlKey(uniqueUrlKey);
            emailHistory.setProjectStatus(projectWorkflow.getWorkflowStepId());
            emailHistory.setCompanyId(companyId != null ? companyId : 1);

            // 保存到数据库
            emailHistoryRepository.save(emailHistory);
            log.debug("邮件历史记录已保存，项目ID: {}, 相关方ID: {}",
                    projectWorkflow.getProjectId(), partyEmail.getPartyID());
        } catch (Exception e) {
            log.error("保存邮件历史记录失败", e);
        }
    }

    /**
     * 发送邮件给特定的项目相关方（带附件列表）
     *
     * @param companyId 公司ID
     * @param toEmail 收件人邮箱
     * @param subject 邮件主题
     * @param emailMessage 邮件内容
     * @param attachFiles 附件列表
     * @return 发送是否成功
     */
    private boolean sendEmailToParty(Integer companyId, String toEmail, String subject, String emailMessage, List<MultipartFile> attachFiles) {
        try {
            log.debug("准备向收件人 {} 发送邮件，公司ID: {}", toEmail, companyId);

            // 获取公司特定的JavaMailSender实例
            JavaMailSender emailSender = mailSenderService.getJavaMailSender(companyId);

            // 获取发件人信息
            String fromEmail = mailSenderService.getSenderEmail(companyId);
            String displayName = mailSenderService.getSenderDisplayName(companyId);

            // 验证邮件地址格式
            if (!isValidEmail(toEmail)) {
                log.error("收件人邮件地址格式无效: {}", toEmail);
                return false;
            }

            if (!isValidEmail(fromEmail)) {
                log.error("发件人邮件地址格式无效: {}", fromEmail);
                return false;
            }

            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(emailMessage, true); // 开启HTML支持

            // 设置发件人（含显示名称）
            helper.setFrom(new InternetAddress(fromEmail, displayName));

            // 添加附件
            if (attachFiles != null && !attachFiles.isEmpty()) {
                for (MultipartFile file : attachFiles) {
                    if (file != null && !file.isEmpty()) {
                        helper.addAttachment(file.getOriginalFilename(), new ByteArrayResource(file.getBytes()));
                    }
                }
            }

            // 发送邮件
            emailSender.send(message);
            log.info("邮件已成功发送至: {}", toEmail);

            return true;

        } catch (Exception e) {
            log.error("发送邮件时发生异常", e);
            return false;
        }
    }
}
