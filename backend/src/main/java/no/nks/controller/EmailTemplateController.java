package no.nks.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import no.nks.dto.CreateEmailTemplateRequest;
import no.nks.dto.CreateEmailTemplateResponse;
import no.nks.dto.DeleteEmailTemplateResponseDto;
import no.nks.dto.EmailTemplateDto;
import no.nks.dto.MultiEmailTemplatesResponse;
import no.nks.entity.User;
import no.nks.service.EmailTemplateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/EmailTemplate") // 与原C#控制器基础路径匹配
@RequiredArgsConstructor
public class EmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    @GetMapping("/GetEmailTemplate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, EmailTemplateDto>> getEmailTemplate(@RequestParam Integer EmailTemplateID, @AuthenticationPrincipal User user) {
        Integer companyId = null;
        if (user != null) {
            companyId = user.getCompanyID();
        } else {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        EmailTemplateDto templateDto = emailTemplateService.getEmailTemplateById(EmailTemplateID, companyId);

        Map<String, EmailTemplateDto> response = new HashMap<>();
        response.put("emailTemplate", templateDto);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/UpdateEmailTemplate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CreateEmailTemplateResponse> updateEmailTemplate(@Valid @RequestBody CreateEmailTemplateRequest request, @AuthenticationPrincipal User user) {
        Integer companyId = null;
        if (user != null) {
            companyId = user.getCompanyID();
        } else {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        EmailTemplateDto templateDto = request.getEmailTemplate();
        EmailTemplateDto updatedDto = emailTemplateService.updateEmailTemplate(templateDto, companyId);

        return ResponseEntity.ok(new CreateEmailTemplateResponse(updatedDto));
    }

    @DeleteMapping("/DeleteEmailTemplate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DeleteEmailTemplateResponseDto> deleteEmailTemplate(@RequestParam Integer EmailTemplateID, @AuthenticationPrincipal User user) {
        Integer companyId = null;
        if (user != null) {
            companyId = user.getCompanyID();
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new DeleteEmailTemplateResponseDto("User authentication error or CompanyID missing.", false));
        }

        if (EmailTemplateID == null) {
            return ResponseEntity.badRequest()
                    .body(new DeleteEmailTemplateResponseDto("EmailTemplateID parameter is required.", false));
        }

        DeleteEmailTemplateResponseDto response = emailTemplateService.deleteEmailTemplate(EmailTemplateID, companyId);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.ok(response); // 保持与 ContactController 相同的响应方式
        }
    }

    @PostMapping("/CreatEmailTemplate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CreateEmailTemplateResponse> creatEmailTemplate(@Valid @RequestBody CreateEmailTemplateRequest request, @AuthenticationPrincipal User user) {
        Integer companyId = null;
        if (user != null) {
            companyId = user.getCompanyID();
        } else {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        EmailTemplateDto templateDto = request.getEmailTemplate();
        EmailTemplateDto createdDto = emailTemplateService.createEmailTemplate(templateDto, companyId);

        return ResponseEntity.ok(new CreateEmailTemplateResponse(createdDto));
    }

    @GetMapping("/GetAllEmailTemplate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MultiEmailTemplatesResponse> getAllEmailTemplate(@AuthenticationPrincipal User user) {
        Integer companyId = null;
        if (user != null) {
            companyId = user.getCompanyID();
        } else {
            throw new AccessDeniedException("User authentication error or CompanyID missing.");
        }

        List<EmailTemplateDto> templates = emailTemplateService.getAllEmailTemplates(companyId);

        return ResponseEntity.ok(new MultiEmailTemplatesResponse(templates));
    }

    @GetMapping("/GetAllEmailHashtags")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> getAllEmailHashtags(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new AccessDeniedException("User authentication error.");
        }

        List<String> hashtags = emailTemplateService.getAllEmailHashtags();

        return ResponseEntity.ok(hashtags);
    }
}
