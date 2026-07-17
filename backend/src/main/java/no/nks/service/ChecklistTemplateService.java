package no.nks.service;

import no.nks.dto.ChecklistItemTemplateDto;
import no.nks.dto.ChecklistTemplateDto;
import no.nks.dto.ResponseDto;

import java.util.List;

public interface ChecklistTemplateService {

    /**
     * Get a checklist template by ID
     */
    ChecklistTemplateDto getChecklistTemplate(Integer checklistTemplateId, Integer companyId);

    /**
     * Update a checklist template
     */
    ChecklistTemplateDto updateChecklistTemplate(ChecklistTemplateDto checklistTemplate, Integer companyId);

    /**
     * Delete a checklist template
     */
    ResponseDto deleteChecklistTemplate(Integer checklistTemplateId, Integer companyId);

    /**
     * Create a checklist template with items
     */
    ChecklistTemplateDto createChecklistTemplate(ChecklistTemplateDto checklistTemplate, Integer companyId);

    /**
     * Get all checklist templates with pagination and search
     */
    List<ChecklistTemplateDto> getAllChecklistTemplates(Integer pageNo, String searchByName, Integer companyId);

    /**
     * Create a checklist item template for a specific checklist template
     */
    ChecklistItemTemplateDto createChecklistItemTemplate(ChecklistItemTemplateDto checklistItemTemplate, Integer companyId);

    /**
     * Update a checklist item template
     */
    ChecklistItemTemplateDto updateChecklistItemTemplate(ChecklistItemTemplateDto checklistItemTemplate, Integer companyId);

    /**
     * Delete a checklist item template
     */
    ResponseDto deleteChecklistItemTemplate(Integer checklistItemId, Integer companyId);
}
