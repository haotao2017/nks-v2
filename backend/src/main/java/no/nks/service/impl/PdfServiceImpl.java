package no.nks.service.impl;

import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import com.lowagie.text.pdf.AcroFields;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfStamper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.workflow.ProjectWorkflowDto;
import no.nks.entity.*;
import no.nks.repository.*;
import no.nks.service.PdfService;
import no.nks.service.S3Service;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfServiceImpl implements PdfService {

    private final S3Service s3Service;
    private final ProjectRepository projectRepository;
    private final ProjectServiceRepository projectServiceRepository;
    private final ServiceRepository serviceRepository;
    private final PostNumberRepository postNumberRepository;
    private final GeneralSettingRepository generalSettingRepository;
    private final UserRepository userRepository;
    private final ProjectChecklistRepository projectChecklistRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final ChecklistItemImageRepository checklistItemImageRepository;
    private final ProjectPartyRepository projectPartyRepository;

    @Override
    public String generatePdfForStepTwo(ProjectWorkflowDto param, PdfTemplateData data) throws Exception {
        Project project = data.project;
        String title = project.getTitle().replaceAll("[^a-zA-Z0-9]", "");
        String fileName = title + "-swcid" + param.getServiceWorkflowCategoryId() + "-S2Doc.pdf";

        String s3companyFolder = "example/";
        String sampleFileName = "Sample.pdf";
        String newPdfFolder = "pdf/";

        InputStream sampleFileStream = s3Service.getFileFromS3(s3companyFolder, sampleFileName);
        if (sampleFileStream == null) {
            throw new RuntimeException("Sample PDF not found in S3: " + sampleFileName);
        }

        PdfReader reader = new PdfReader(sampleFileStream);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        PdfStamper stamper = new PdfStamper(reader, output, '\0', true);
        stamper.setFormFlattening(true);

        AcroFields form = stamper.getAcroFields();
        form.setField("Tekst264", project.getKommune());
        form.setField("Tekst257", project.getGardsNo());
        form.setField("Tekst261", project.getBruksnmmer());
        form.setField("Tekst254", project.getAddress());
        form.setField("Tekst255", String.valueOf(project.getPostNo()));
        form.setField("Tekst256", project.getPoststed());

        if (data.settings != null) {
            form.setField("Foretak_2", data.settings.getCompanyName());
            form.setField("Organisasjonsnr", data.settings.getOrganizationalNumber());
            form.setField("Adresse_2", data.settings.getAddress());
            form.setField("Tekst4", String.valueOf(data.settings.getPostCode()));
            if(data.postNumber != null){
                 form.setField("Tekst5", data.postNumber.getPoststed());
            }
            form.setField("Tekst105", data.settings.getOwnerName());
            form.setField("Telefon", data.settings.getTelephone());
            form.setField("Mobiltelefon", data.settings.getMobile());
        }

        // Fill services grid
        int i = 1;
        for (no.nks.entity.Service service : data.services) {
            if (service.getServiceTypeId() != null && service.getServiceTypeId() != 3) {
                if (i <= 12) { // PDF has limited rows
                    form.setField("NedtrekkslisteRow" + i, "kontroll");
                    form.setField("Beskrivelse av ansvarsområdetRow" + i, service.getName());
                    form.setField("Nedtrekksliste" + (22 + i), String.valueOf(service.getServiceTypeId()));
                    form.setField("Avmerkingsboks10#" + i, "Ja");
                    form.setField("Avmerkingsboks810" + (i > 1 ? String.valueOf(i-1) : ""), "Ja");
                }
                i++;
            }
        }

        stamper.setFormFlattening(true);
        stamper.close();
        reader.close();

        s3Service.uploadFile(newPdfFolder, new ByteArrayInputStream(output.toByteArray()), fileName, "application/pdf");

        return s3Service.createPublicUrl(null, null, newPdfFolder, fileName);
    }

    @Override
    public String generatePdfForStepThirteen(ProjectWorkflowDto param, PdfTemplateData data) throws Exception {
        Project project = data.project;
        String title = project.getTitle().replaceAll("[^a-zA-Z0-9]", "");
        String fileName = title + "Kontrollerklæring med sluttrapport12.pdf";
        String sampleFileName = "Kontrollerklæring NBK.pdf";
        String s3companyFolder = "example/";
        String newPdfFolder = "pdf/";

        InputStream sampleFileStream = s3Service.getFileFromS3(s3companyFolder, sampleFileName);
        if (sampleFileStream == null) {
            throw new RuntimeException("Sample PDF not found in S3: " + sampleFileName);
        }

        PdfReader reader = new PdfReader(sampleFileStream);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        PdfStamper stamper = new PdfStamper(reader, output, '\0', true);
        AcroFields form = stamper.getAcroFields();

        List<no.nks.entity.ProjectService> projectServices = projectServiceRepository.findByProjectId(project.getId());
        String servicesName = projectServices.stream()
                .map(ps -> serviceRepository.findById(ps.getServiceId()).map(no.nks.entity.Service::getName).orElse(""))
                .collect(Collectors.joining("\r"));

        form.setField("Tekst257", project.getGardsNo());
        form.setField("Tekst261", project.getBruksnmmer());
        form.setField("Tekst264", project.getKommune());
        form.setField("Tekst254", project.getAddress());
        form.setField("Tekst255", project.getPostNo());
        form.setField("Tekst256", data.postNumber != null ? data.postNumber.getPoststed() : "");
        form.setField("Dato", java.time.format.DateTimeFormatter.ofPattern("dd.MM.yy").format(java.time.LocalDate.now()));
        form.setField("Tekst6", project.getDated() != null ? java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy").format(project.getDated()) : "");
        form.setField("Hentet fra søknad om ansvarsrett", "Uavhengig kontroll:\r" + servicesName);
        form.removeField("Signatur foretak j");

        stamper.close();
        reader.close();

        s3Service.uploadFile(newPdfFolder, new ByteArrayInputStream(output.toByteArray()), fileName, "application/pdf");

        return s3Service.createPublicUrl(null, null, newPdfFolder, fileName);
    }

    @Override
    public String generatePdfForStepFourteen(ProjectWorkflowDto param, PdfTemplateData data) throws Exception {
        Project project = data.project;
        String title = project.getTitle().replaceAll("[^a-zA-Z0-9]", "");
        String fileName = title + "-FinalReport.pdf";
        String bucketFolder = "final-report-pdf/";

        String mainTemplate = s3Service.getFileContentAsString("example/", "FinalReport.html");
        String checklistTemplate = s3Service.getFileContentAsString("example/", "Checklist.html");
        String checklistItemTemplate = s3Service.getFileContentAsString("example/", "CheckListItem.html");
        String checklistImageTemplate = s3Service.getFileContentAsString("example/", "ChecklistImage.html");

        // --- Optimization: Embed resources as Base64 to avoid network lookups ---
        // 1. Embed CSS
        try {
            String cssContent = loadCssFromClasspath("/css/bootstrap.min.css");
            mainTemplate = mainTemplate.replace("<link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css\">",
                                            "<style>" + cssContent + "</style>");
        } catch (Exception e) {
            log.error("Could not embed bootstrap.min.css", e);
            // Continue without CSS if it fails
        }

        // 2. Embed Images
        String mainLogoBase64 = s3Service.getFileAsBase64("example/", "logoNosk.jpg");
        String backgroundImgBase64 = s3Service.getFileAsBase64("example/", "FinalReportPdfBackgroundImage.png");
        String runePngOneBase64 = s3Service.getFileAsBase64("example/", "RuneSignature.jpg");
        String runePngTwoBase64 = s3Service.getFileAsBase64("example/", "RuneSignaturePDFSecond.jpg");

        if (mainLogoBase64 != null && !mainLogoBase64.isEmpty()) {
            mainTemplate = mainTemplate.replace("{#MainImageSource#}", "data:image/jpeg;base64," + mainLogoBase64);
        }
        if (backgroundImgBase64 != null && !backgroundImgBase64.isEmpty()) {
            mainTemplate = mainTemplate.replace("{#FinalReportPdfBackgroundImage#}", "data:image/png;base64," + backgroundImgBase64);
        }

        if (runePngOneBase64 != null && !runePngOneBase64.isEmpty()) {
            mainTemplate = mainTemplate.replace("https://webapp.nbkontroll.no/Resources/global/images/runePngOne.png", "data:image/png;base64," + runePngOneBase64);
        } else {
             log.warn("runePngOne.png not found in S3 or failed to encode. PDF may be missing an image.");
        }

        if (runePngTwoBase64 != null && !runePngTwoBase64.isEmpty()) {
            mainTemplate = mainTemplate.replace("https://webapp.nbkontroll.no/Resources/global/images/runePngTwo.png", "data:image/png;base64," + runePngTwoBase64);
        } else {
            log.warn("runePngTwo.png not found in S3 or failed to encode. PDF may be missing an image.");
        }
        // --- End Optimization ---

        String inspectorName = project.getInspectorId() != null ? userRepository.findById(project.getInspectorId()).map(User::getFullName).orElse("") : "";
        String vatromPartyName = projectPartyRepository.findProjectPartyDetailsByProjectIdAndPartyType(project.getId(), 8).stream().findFirst().map(no.nks.dto.ProjectPartyDetailsDto::getPartyName).orElse("");
        String tomrerPartyName = projectPartyRepository.findProjectPartyDetailsByProjectIdAndPartyType(project.getId(), 10).stream().findFirst().map(no.nks.dto.ProjectPartyDetailsDto::getPartyName).orElse("");

        mainTemplate = mainTemplate.replace("{#ProjectTitleHead#}", Objects.toString(project.getTitle(), ""));
        mainTemplate = mainTemplate.replace("{#ProjectTitle#}", Objects.toString(project.getAddress(), ""));
        mainTemplate = mainTemplate.replace("{#CurrentDate#}", java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy").format(java.time.LocalDate.now()));
        mainTemplate = mainTemplate.replace("{#Gnr#}", Objects.toString(project.getGardsNo(), ""));
        mainTemplate = mainTemplate.replace("{#Bnr#}", Objects.toString(project.getBruksnmmer(), ""));
        mainTemplate = mainTemplate.replace("{#Kommune#}", Objects.toString(project.getKommune(), ""));
        mainTemplate = mainTemplate.replace("{#PostNo#}", Objects.toString(project.getPostNo(), ""));
        mainTemplate = mainTemplate.replace("{#Poststed#}", data.postNumber != null ? Objects.toString(data.postNumber.getPoststed(), "") : "");
        mainTemplate = mainTemplate.replace("{#Inspector#}", Objects.toString(inspectorName, ""));
        mainTemplate = mainTemplate.replace("{#InspectionSchedule#}", project.getAssignInspectorCDate() != null ? java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy").format(project.getAssignInspectorCDate()) : "");
        mainTemplate = mainTemplate.replace("{#VatromParty#}", Objects.toString(vatromPartyName, ""));
        mainTemplate = mainTemplate.replace("{#TomrerParty#}", Objects.toString(tomrerPartyName, ""));
        mainTemplate = mainTemplate.replace("{#ExcecutedControl#}", project.getInspectionDate() != null ? java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy").format(project.getInspectionDate()) : "");
        mainTemplate = mainTemplate.replace("{#Avvik#}", Objects.toString(project.getAvvik(), ""));
        mainTemplate = mainTemplate.replace("{#DeviationSendApplicant#}", project.getAssignInspectorCDate() != null ? java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy").format(project.getAssignInspectorCDate()) : "");
        mainTemplate = mainTemplate.replace("{#ApneAvvikSendtKommunen#}", Objects.toString(project.getAvvikSendtKommune(), ""));
        mainTemplate = mainTemplate.replace("{#Lufttetthet#}", Objects.toString(project.getTepmlateValue(), ""));

        StringBuilder allChecklistsHtml = new StringBuilder();
        List<ProjectChecklist> checklists = projectChecklistRepository.findByProjectId(project.getId());

        for (ProjectChecklist checklist : checklists) {
            String currentChecklistHtml = new String(checklistTemplate);

            StringBuilder allChecklistItemsHtml = new StringBuilder();
            List<ChecklistItem> items = checklistItemRepository.findByChecklistId(checklist.getId());

            for (ChecklistItem item : items) {
                String currentItemHtml = new String(checklistItemTemplate);
                currentItemHtml = currentItemHtml.replace("{#ChecklistName#}", Objects.toString(checklist.getChecklistName(), ""));

                String deviation = "Ingen";
                if (item.getStatus() != null) {
                    if (item.getStatus().equals("OK") || item.getStatus().equals("NA")) {
                        deviation = "Ingen";
                    } else if (item.getWasDev() != null && !item.getWasDev() && item.getEmailPartyDate() != null) {
                        deviation = item.getComment() + ". Dokumentasjon oversendt – avvik lukket";
                    } else if (item.getWasDev() != null && !item.getWasDev() && item.getEmailPartyDate() == null) {
                        deviation = item.getComment() + ". Dokumentasjon ikke sendt - avvik lukket";
                    } else if (item.getStatus().equals("Dev") && item.getWasDev() != null && item.getWasDev() && item.getEmailPartyDate() != null) {
                         deviation = item.getComment() + ". Dokumentasjon oversendt - avvik";
                    } else if (item.getStatus().equals("Dev") && item.getWasDev() != null && item.getWasDev() && item.getEmailPartyDate() == null) {
                        deviation = item.getComment() + ". Dokumentasjon ikke sendt - avvik";
                    }
                }

                currentItemHtml = currentItemHtml.replace("{#ChecklistItemName#}", Objects.toString(item.getTitle(), ""));
                currentItemHtml = currentItemHtml.replace("{#ProjectInspector#}", Objects.toString(inspectorName, ""));
                currentItemHtml = currentItemHtml.replace("{#ChecklistItemStatus#}", Objects.toString(deviation, ""));
                currentItemHtml = currentItemHtml.replace("{#Checkliststatus#}", Objects.toString(item.getStatus(), ""));
                currentItemHtml = currentItemHtml.replace("{#ChecklistItemComment#}", Objects.toString(item.getComment(), ""));

                StringBuilder allImagesHtml = new StringBuilder();
                List<ChecklistItemImage> images = checklistItemImageRepository.findByChecklistItemIdAndIsOkForFinalPdf(item.getId(), true);
                if (!images.isEmpty()) {
                    currentItemHtml = currentItemHtml.replace("{ImagesHeading}", "Bilder");
                    for (ChecklistItemImage image : images) {
                        String currentImageHtml = new String(checklistImageTemplate);

                        // --- Optimization: Embed image data directly ---
                        String imageBase64 = s3Service.getFileAsBase64("inspection-checklist-images/", image.getImageName() + (image.getImageType() != null ? image.getImageType() : ""));
                        if (imageBase64 != null) {
                            String imageUrl = "data:image/jpeg;base64," + imageBase64; // Assuming jpeg, adjust if needed
                            currentImageHtml = currentImageHtml.replace("{#ImageSource#}", Objects.toString(imageUrl, ""));
                        } else {
                            currentImageHtml = currentImageHtml.replace("{#ImageSource#}", ""); // Clear if image not found
                        }
                        // --- End Optimization ---

                        currentImageHtml = currentImageHtml.replace("{#ChecklistTypeImageDesc#}", Objects.toString(item.getTitle(), ""));
                        allImagesHtml.append(currentImageHtml);
                    }
                } else {
                     currentItemHtml = currentItemHtml.replace("{ImagesHeading}", "");
                }

                currentItemHtml = currentItemHtml.replace("{#DivChecklistImages#}", allImagesHtml.toString());
                allChecklistItemsHtml.append(currentItemHtml);
            }
            currentChecklistHtml = currentChecklistHtml.replace("{#ProjectTitle#}", Objects.toString(project.getAddress(), ""));
            currentChecklistHtml = currentChecklistHtml.replace("{#CompanyName#}", data.settings != null ? Objects.toString(data.settings.getCompanyName(), "") : "");
            currentChecklistHtml = currentChecklistHtml.replace("{#CurrentDate#}", java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy").format(java.time.LocalDate.now()));
            currentChecklistHtml = currentChecklistHtml.replace("{#ChecklistName#}", Objects.toString(checklist.getChecklistName(), ""));
            currentChecklistHtml = currentChecklistHtml.replace("{#ProjectInspector#}", Objects.toString(inspectorName, ""));
            currentChecklistHtml = currentChecklistHtml.replace("{#Comments#}", Objects.toString(checklist.getComment(), ""));
            currentChecklistHtml = currentChecklistHtml.replace("{#DivChecklistTypeImages#}", allChecklistItemsHtml.toString());
            allChecklistsHtml.append(currentChecklistHtml);
        }

        mainTemplate = mainTemplate.replace("{#Project#}", allChecklistsHtml.toString());

        ByteArrayOutputStream pdfOutputStream = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(mainTemplate, pdfOutputStream);
        InputStream pdfInputStream = new ByteArrayInputStream(pdfOutputStream.toByteArray());

        s3Service.uploadFile(bucketFolder, pdfInputStream, fileName, "application/pdf");

        return s3Service.createPublicUrl(null, null, bucketFolder, fileName);
    }

    private String loadCssFromClasspath(String path) {
        try (InputStream inputStream = getClass().getResourceAsStream(path)) {
            if (inputStream == null) {
                log.error("Cannot find resource: {}", path);
                return "";
            }
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Error reading resource from classpath: {}", path, e);
            return "";
        }
    }
}
