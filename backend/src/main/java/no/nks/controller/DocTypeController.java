package no.nks.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.RequestResponse;
import no.nks.entity.User;
import no.nks.entity.WrapperDocType;
import no.nks.entity.WrapperMultiDocTypes;
import no.nks.service.DocTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/DocType")
@RequiredArgsConstructor
public class DocTypeController {

    private final DocTypeService docTypeService;

    @GetMapping("/GetDocType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDocType(@RequestParam int DocTypeID, @AuthenticationPrincipal User user) {
        Integer companyId = user.getCompanyID();
        WrapperDocType data = docTypeService.getSingleDocType(DocTypeID, companyId);
        return ResponseEntity.ok(data);
    }

    @PutMapping("/UpdateDocType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateDocType(@Valid @RequestBody WrapperDocType userParam, @AuthenticationPrincipal User user) {
        Integer companyId = user.getCompanyID();
        WrapperDocType data = docTypeService.updateSingleDocType(userParam.getDocType(), companyId);
        return ResponseEntity.ok(data);
    }

    @DeleteMapping("/DeleteDocType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteDocType(@RequestParam int DocTypeID, @AuthenticationPrincipal User user) {
        Integer companyId = user.getCompanyID();
        RequestResponse response = docTypeService.deleteSingleDocType(DocTypeID, companyId);
        if (!response.isSuccess()) {
            log.warn("Failed to delete document type: {}", response.getMessage());
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/CreatDocType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> creatDocType(@Valid @RequestBody WrapperDocType userParam, @AuthenticationPrincipal User user) {
        Integer companyId = user.getCompanyID();
        WrapperDocType data = docTypeService.createSingleDocType(userParam.getDocType(), companyId);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/GetAllDocType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllDocType(@AuthenticationPrincipal User user) {
        Integer companyId = user.getCompanyID();
        WrapperMultiDocTypes data = docTypeService.getAllDocType(companyId);
        return ResponseEntity.ok(data);
    }
}
