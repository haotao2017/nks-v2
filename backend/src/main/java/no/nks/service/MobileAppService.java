package no.nks.service;

import no.nks.dto.api.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MobileAppService {
    /**
     * Gets a list of projects for an inspector
     * @param inspectorId The inspector user ID
     * @param companyId The company ID
     * @return ResponseContainer with list of projects
     */
    ResponseContainer getProjectList(Integer inspectorId, Integer companyId);

    /**
     * Gets details of a specific project
     * @param projectId The project ID
     * @param companyId The company ID
     * @return ProjectDetailContainer with project details
     */
    ProjectDetailContainer getProjectDetail(Integer projectId, Integer companyId);

    /**
     * Updates a project with description and possibly image
     * @param requestJson JSON string containing project update data
     * @param file Optional project image file
     * @param companyId The company ID
     * @return Response with status of update
     */
    Response updateProject(String requestJson, MultipartFile file, Integer companyId);

    /**
     * Submits a project with inspector comments and signature
     * @param submitContainer Container with project submit data
     * @return Response with status of submission
     */
    Response submitProject(ProjectSubmitContainer submitContainer);

    /**
     * Gets checklist items for a checklist
     * @param checklistId The checklist ID
     * @param companyId The company ID
     * @return ChecklistItemContainer with checklist items
     */
    ChecklistItemContainer getChecklistItems(Integer checklistId, Integer companyId);

    /**
     * Updates a checklist item, possibly with images
     * @param requestJson JSON string containing checklist update data
     * @param files Optional list of image files to attach to the checklist item
     * @param companyId The company ID
     * @return ChecklistItemUpdateResponse with status of update
     */
    ChecklistItemUpdateResponse updateChecklistItem(String requestJson, List<MultipartFile> files, Integer companyId);

    /**
     * Gets logs for a project
     * @param projectId The project ID
     * @return List of inspection logs
     */
    List<InspectionLogDto> getProjectLogs(Integer projectId);

    /**
     * Gets checklist templates for a company
     * @param companyId The company ID
     * @return ChecklistTemplateContainer with list of templates
     */
    ChecklistTemplateContainer getChecklistTemplates(Integer companyId);

    /**
     * Creates a checklist from template and/or custom items with automatic project creation
     * @param request The template-based and/or custom checklist creation request
     * @param userId The user ID
     * @param companyId The company ID
     * @return CreateChecklistWithProjectResponse with created project and checklist info
     */
    CreateChecklistWithProjectResponse createChecklistFromTemplate(CreateChecklistFromTemplateRequest request, Integer userId, Integer companyId);
}
