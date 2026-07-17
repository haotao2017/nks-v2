package no.nks.service;

import no.nks.dto.workflow.ProjectWorkflowDto;
import org.springframework.web.multipart.MultipartFile;

public interface ProjectWorkflowAsyncService {
    void performStep13BackgroundTasks(ProjectWorkflowDto projectWorkflow, byte[] fileBytes, String originalFilename, Integer companyId);
    void performStep14BackgroundTasks(ProjectWorkflowDto projectWorkflow, byte[] fileBytes, String originalFilename, Integer companyId);
}
