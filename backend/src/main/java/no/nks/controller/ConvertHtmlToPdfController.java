package no.nks.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.ConvertToPdfRequest;
import no.nks.dto.ConvertToPdfResponse;
import no.nks.entity.User;
import no.nks.service.HtmlToPdfService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ConvertHtmlToPdf")
@RequiredArgsConstructor
@Slf4j
public class ConvertHtmlToPdfController {

    private final HtmlToPdfService htmlToPdfService;

    @PostMapping("/ConvertToPdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConvertToPdfResponse> convertToPdf(
            @RequestBody ConvertToPdfRequest request,
            @AuthenticationPrincipal User user) {

        Integer companyId = null;
        if (user != null) {
            companyId = user.getCompanyID();
        }

        String fileUrl = htmlToPdfService.convertHtmlToPdfAndUpload(request.getContent(), null, companyId);

        return ResponseEntity.ok(new ConvertToPdfResponse(fileUrl));
    }
}
