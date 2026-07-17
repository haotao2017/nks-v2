package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.workflow.ProjectWorkflowDto;
import no.nks.service.EmailService;
import no.nks.service.ProjectService;
import no.nks.service.ProjectWorkflowAsyncService;
import no.nks.service.S3Service;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;
import org.apache.commons.io.FilenameUtils;


@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectWorkflowAsyncServiceImpl implements ProjectWorkflowAsyncService {

    private final S3Service s3Service;
    private final EmailService emailService;
    private final ProjectService projectService;

    @Override
    @Async
    public void performStep13BackgroundTasks(ProjectWorkflowDto projectWorkflow, byte[] fileBytes, String originalFilename, Integer companyId) {
        log.info("Starting background tasks for step 13, project ID: {}", projectWorkflow.getProjectId());
        try {
            MultipartFile fileToProcess = null;
            if (fileBytes != null && originalFilename != null) {
                fileToProcess = new InMemoryMultipartFile(originalFilename, originalFilename, null, fileBytes);

                String uniqueFileName = generateUniqueFileName(originalFilename);
                String bucketFolder = "pdf/";
                s3Service.uploadFile(bucketFolder, fileToProcess, uniqueFileName);
                projectWorkflow.setFileName(uniqueFileName);
            }

            emailService.sendEmailWithAttachmentAndSaveHistoryAsync(projectWorkflow, fileToProcess, companyId);

            projectService.updateProjectKontrollerklaeringPdfDate(projectWorkflow.getProjectId(), companyId);

            log.info("Successfully completed background tasks for step 13, project ID: {}", projectWorkflow.getProjectId());
        } catch (Exception e) {
            log.error("Error during background processing for step 13, project ID: {}", projectWorkflow.getProjectId(), e);
        }
    }

    @Override
    @Async
    public void performStep14BackgroundTasks(ProjectWorkflowDto projectWorkflow, byte[] fileBytes, String originalFilename, Integer companyId) {
        log.info("Starting background tasks for step 14, project ID: {}", projectWorkflow.getProjectId());
        try {
            MultipartFile fileToProcess = null;
            if (fileBytes != null && originalFilename != null) {
                fileToProcess = new InMemoryMultipartFile(originalFilename, originalFilename, null, fileBytes);

                String uniqueFileName = generateUniqueFileName(originalFilename);
                String bucketFolder = "pdf/";
                s3Service.uploadFile(bucketFolder, fileToProcess, uniqueFileName);
                projectWorkflow.setFileName(uniqueFileName);
            }

            emailService.sendEmailWithAttachmentAndSaveHistoryAsync(projectWorkflow, fileToProcess, companyId);

            projectService.updateProjectFinalReportPdfDate(projectWorkflow.getProjectId(), companyId);

            log.info("Successfully completed background tasks for step 14, project ID: {}", projectWorkflow.getProjectId());
        } catch (Exception e) {
            log.error("Error during background processing for step 14, project ID: {}", projectWorkflow.getProjectId(), e);
        }
    }

    private String generateUniqueFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isEmpty()) {
            return UUID.randomUUID().toString();
        }

        String extension = FilenameUtils.getExtension(originalFileName);
        return UUID.randomUUID() + "." + extension;
    }

    private static class InMemoryMultipartFile implements MultipartFile {
        private final String name;
        private final String originalFilename;
        private final String contentType;
        private final byte[] content;

        public InMemoryMultipartFile(String name, String originalFilename, String contentType, byte[] content) {
            this.name = name;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
            this.content = content;
        }

        @Override
        public String getName() {
            return name;
        }

        @Override
        public String getOriginalFilename() {
            return originalFilename;
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public boolean isEmpty() {
            return content == null || content.length == 0;
        }

        @Override
        public long getSize() {
            return content.length;
        }

        @Override
        public byte[] getBytes() throws IOException {
            return content;
        }

        @Override
        public InputStream getInputStream() throws IOException {
            return new ByteArrayInputStream(content);
        }

        @Override
        public void transferTo(File dest) throws IOException, IllegalStateException {
            try (FileOutputStream fos = new FileOutputStream(dest)) {
                fos.write(content);
            }
        }
    }
}
