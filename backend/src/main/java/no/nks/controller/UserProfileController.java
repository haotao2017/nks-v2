package no.nks.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.CreateUserProfileRequest;
import no.nks.dto.GenericApiResponseDto;
import no.nks.dto.UpdateUserProfileRequest;
import no.nks.dto.UserProfileDto;
import no.nks.entity.User;
import no.nks.service.UserProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/UserProfile")
@RequiredArgsConstructor
@Slf4j
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping("/GetUserProfile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUserProfile(@RequestParam("UserProfileID") Integer userProfileID, @AuthenticationPrincipal User currentUser) {
        log.info("Received request to get user profile for ID: {} by user: {}", userProfileID, currentUser.getUsername());

        if (userProfileID == null) {
            log.warn("UserProfileID parameter is missing.");
            // Consider a more specific error DTO if you have one standardized
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "UserProfileID parameter is required.");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Exceptions (EntityNotFoundException, AccessDeniedException) will be handled by a global exception handler (@ControllerAdvice)
        UserProfileDto userProfileDto = userProfileService.getUserProfile(userProfileID, currentUser);

        Map<String, UserProfileDto> response = new HashMap<>();
        response.put("userProfile", userProfileDto);

        log.info("Successfully retrieved user profile for ID: {}", userProfileID);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/UpdateUserProfile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateUserProfile(@Valid @RequestBody UpdateUserProfileRequest request, @AuthenticationPrincipal User currentUser) {
        log.info("Received request to update user profile for user ID: {} by user: {}",
                 request.getUserProfile() != null ? request.getUserProfile().getId() : "null_in_request_object",
                 currentUser.getUsername());

        // @Valid on UpdateUserProfileRequest and UserProfileUpdateDto.id handles null checks for these
        // UserProfileUpdateDto itself can be null if UpdateUserProfileRequest.userProfile is null, handled by @NotNull on the field.
        // UserProfileUpdateDto.id being null is handled by @NotNull on that field.

        UserProfileDto updatedProfile = userProfileService.updateUserProfile(request.getUserProfile(), currentUser);

        Map<String, UserProfileDto> response = new HashMap<>();
        response.put("userProfile", updatedProfile);

        log.info("Successfully updated user profile for ID: {}", updatedProfile.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/CreateUserProfile")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") // or hasRole('ADMIN') - ensure it matches UserDetails setup
    public ResponseEntity<?> createUserProfile(@Valid @RequestBody CreateUserProfileRequest request) {
        log.info("Received request to create new user profile by an admin. Username: {}",
                 request.getUserProfile() != null ? request.getUserProfile().getUserName() : "null_in_request_object");

        UserProfileDto createdProfile = userProfileService.createUserProfile(request.getUserProfile());

        Map<String, UserProfileDto> response = new HashMap<>();
        response.put("userProfile", createdProfile);

        log.info("Successfully created new user profile with ID: {}", createdProfile.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/DeleteUserProfile")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<GenericApiResponseDto> deleteUserProfile(@RequestParam("UserProfileID") Integer userProfileID) {
        log.info("Received request to delete user profile with ID: {} by an admin.", userProfileID);

        if (userProfileID == null) {
            log.warn("UserProfileID parameter is missing for delete operation.");
            return new ResponseEntity<>(new GenericApiResponseDto("UserProfileID parameter is required.", false), HttpStatus.BAD_REQUEST);
        }

        userProfileService.deleteUserProfile(userProfileID); // Service handles UserNotFoundForOperationException

        log.info("Successfully processed deletion for user profile ID: {}", userProfileID);
        return ResponseEntity.ok(new GenericApiResponseDto("Record deleted", true));
    }

    @GetMapping("/GetAllUserProfile")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, List<UserProfileDto>>> getAllUserProfiles() {
        log.info("Received request to get all user profiles by an admin.");

        List<UserProfileDto> userProfileDtos = userProfileService.getAllUserProfiles();

        Map<String, List<UserProfileDto>> response = new HashMap<>();
        response.put("multiUserProfiles", userProfileDtos);

        log.info("Successfully fetched {} user profiles.", userProfileDtos.size());
        return ResponseEntity.ok(response);
    }
}
