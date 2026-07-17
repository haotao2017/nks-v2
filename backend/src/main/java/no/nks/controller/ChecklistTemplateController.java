package no.nks.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.*;
import no.nks.entity.User;
import no.nks.service.ChecklistTemplateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ChecklistTemplate")
@RequiredArgsConstructor
@Slf4j
public class ChecklistTemplateController {

    private final ChecklistTemplateService checklistTemplateService;

    @GetMapping("/GetChecklistTemplate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, ChecklistTemplateDto>> getChecklistTemplate(
            @RequestParam Integer ChecklistTemplateID,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateUserAndGetCompanyId(user);

        ChecklistTemplateDto template = checklistTemplateService.getChecklistTemplate(ChecklistTemplateID, companyId);

        Map<String, ChecklistTemplateDto> response = new HashMap<>();
        response.put("checklistTemplate", template);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/UpdateChecklistTemplate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, ChecklistTemplateDto>> updateChecklistTemplate(
            @Valid @RequestBody ChecklistTemplateWrapperDto wrapperDto,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateUserAndGetCompanyId(user);

        ChecklistTemplateDto template = checklistTemplateService.updateChecklistTemplate(
                wrapperDto.getChecklistTemplate(), companyId);

        Map<String, ChecklistTemplateDto> response = new HashMap<>();
        response.put("checklistTemplate", template);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/DeleteChecklistTemplate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseDto> deleteChecklistTemplate(
            @RequestParam Integer ChecklistTemplateID,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateUserAndGetCompanyId(user);

        ResponseDto response = checklistTemplateService.deleteChecklistTemplate(ChecklistTemplateID, companyId);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/CreatChecklistTemplateWithItems")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, ChecklistTemplateDto>> createChecklistTemplateWithItems(
            @Valid @RequestBody ChecklistTemplateWrapperDto wrapperDto,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateUserAndGetCompanyId(user);

        ChecklistTemplateDto createdTemplate = checklistTemplateService.createChecklistTemplate(
                wrapperDto.getChecklistTemplate(), companyId);

        Map<String, ChecklistTemplateDto> response = new HashMap<>();
        response.put("checklistTemplate", createdTemplate);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/GetAllChecklistTemplate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, List<ChecklistTemplateDto>>> getAllChecklistTemplate(
            @RequestParam(required = false, defaultValue = "0") Integer pageNo,
            @RequestParam(required = false) String searchByName,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateUserAndGetCompanyId(user);

        List<ChecklistTemplateDto> templates = checklistTemplateService.getAllChecklistTemplates(
                pageNo, searchByName, companyId);

        Map<String, List<ChecklistTemplateDto>> response = new HashMap<>();
        response.put("multiChecklistTemplate", templates);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/CreatChecklistItemTempByChecklistTempId")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, ChecklistItemTemplateDto>> createChecklistItemTempByChecklistTempId(
            @Valid @RequestBody ChecklistItemTemplateWrapperDto wrapperDto,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateUserAndGetCompanyId(user);

        ChecklistItemTemplateDto createdItem = checklistTemplateService.createChecklistItemTemplate(
                wrapperDto.getChecklistItemTemplate(), companyId);

        Map<String, ChecklistItemTemplateDto> response = new HashMap<>();
        response.put("checklistItemTemplate", createdItem);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/UpdateSingleChecklistItemTemp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, ChecklistItemTemplateDto>> updateSingleChecklistItemTemp(
            @Valid @RequestBody ChecklistItemTemplateWrapperDto wrapperDto,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateUserAndGetCompanyId(user);

        ChecklistItemTemplateDto updatedItem = checklistTemplateService.updateChecklistItemTemplate(
                wrapperDto.getChecklistItemTemplate(), companyId);

        Map<String, ChecklistItemTemplateDto> response = new HashMap<>();
        response.put("checklistItemTemplate", updatedItem);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/DeleteSingleChecklistItemTemp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseDto> deleteSingleChecklistItemTemp(
            @RequestParam Integer ChecklistItemId,
            @AuthenticationPrincipal User user) {

        Integer companyId = validateUserAndGetCompanyId(user);

        ResponseDto response = checklistTemplateService.deleteChecklistItemTemplate(ChecklistItemId, companyId);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Helper method to validate user and extract companyId
     */
    private Integer validateUserAndGetCompanyId(User user) {
        if (user == null || user.getCompanyID() == null) {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }
        return user.getCompanyID();
    }
}
