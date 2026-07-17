package no.nks.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.GenericApiResponseDto;
import no.nks.dto.PartyTypeDto;
import no.nks.dto.PartyTypeRequestDto;
import no.nks.dto.PartyTypeResponseDto;
import no.nks.entity.User;
import no.nks.service.PartyTypeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/PartyType")
@RequiredArgsConstructor
@Slf4j
public class PartyTypeController {

    private final PartyTypeService partyTypeService;

    @GetMapping("/GetPartyType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPartyType(@RequestParam("PartyTypeID") Integer partyTypeId, @AuthenticationPrincipal User user) {
        log.info("Received request to get party type with ID: {} by user: {}", partyTypeId, user.getUsername());

        if (partyTypeId == null) {
            throw new IllegalArgumentException("PartyTypeID parameter is required");
        }

        Integer companyId = user.getCompanyID();
        PartyTypeResponseDto response = partyTypeService.getSinglePartyType(partyTypeId, companyId);

        log.info("Successfully retrieved party type for ID: {}", partyTypeId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/UpdatePartyType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updatePartyType(@Valid @RequestBody PartyTypeRequestDto request, @AuthenticationPrincipal User user) {
        log.info("Received request to update party type with ID: {}",
                request.getPartyType() != null ? request.getPartyType().getId() : "null_in_request");

        if (request.getPartyType() == null || request.getPartyType().getId() == null) {
            throw new IllegalArgumentException("PartyType and PartyType.Id are required");
        }

        Integer companyId = user.getCompanyID();
        PartyTypeResponseDto response = partyTypeService.updatePartyType(request.getPartyType(), companyId);

        log.info("Successfully updated party type with ID: {}", request.getPartyType().getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/DeletePartyType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<GenericApiResponseDto> deletePartyType(@RequestParam("PartyTypeID") Integer partyTypeId, @AuthenticationPrincipal User user) {
        log.info("Received request to delete party type with ID: {}", partyTypeId);

        if (partyTypeId == null) {
            throw new IllegalArgumentException("PartyTypeID parameter is required");
        }

        Integer companyId = user.getCompanyID();
        GenericApiResponseDto response = partyTypeService.deletePartyType(partyTypeId, companyId);

        if (!response.isSuccess()) {
            log.warn("Failed to delete party type with ID: {}, reason: {}", partyTypeId, response.getMessage());
            return ResponseEntity.badRequest().body(response);
        }

        log.info("Successfully deleted party type with ID: {}", partyTypeId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/CreatePartyType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createPartyType(@Valid @RequestBody PartyTypeRequestDto request, @AuthenticationPrincipal User user) {
        log.info("Received request to create new party type");

        if (request.getPartyType() == null) {
            throw new IllegalArgumentException("PartyType is required");
        }

        Integer companyId = user.getCompanyID();
        PartyTypeResponseDto response = partyTypeService.createPartyType(request.getPartyType(), companyId);

        log.info("Successfully created new party type with ID: {}", response.getPartyType().getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/GetAllPartyType")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllPartyType(@AuthenticationPrincipal User user) {
        log.info("Received request to get all party types");

        Integer companyId = user.getCompanyID();
        List<PartyTypeDto> partyTypes = partyTypeService.getAllPartyTypes(companyId);

        Map<String, List<PartyTypeDto>> response = new HashMap<>();
        response.put("multiPartyTypes", partyTypes);

        log.info("Successfully retrieved {} party types", partyTypes.size());
        return ResponseEntity.ok(response);
    }
}
