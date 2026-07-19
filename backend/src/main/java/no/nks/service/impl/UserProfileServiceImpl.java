package no.nks.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.CreateUserProfileDto;
import no.nks.dto.UserProfileDto;
import no.nks.dto.UserProfileUpdateDto;
import no.nks.entity.ContactBook;
import no.nks.entity.User;
import no.nks.exception.UserNotFoundForOperationException;
import no.nks.exception.UsernameConflictException;
import no.nks.repository.ContactBookRepository;
import no.nks.repository.UserRepository;
import no.nks.service.UserProfileService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final ContactBookRepository contactBookRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserProfileDto getUserProfile(Integer userProfileQueryId, User requestingUser) {
        log.info("Fetching user profile for ID: {} by user: {}", userProfileQueryId, requestingUser.getUsername());

        User targetUser = findUserById(userProfileQueryId);

        // Authorization check
        if (!Boolean.TRUE.equals(requestingUser.getIsAdmin()) && !userProfileQueryId.equals(requestingUser.getId())) {
            log.warn("Access denied for user {} attempting to access profile for user ID {}. User is not admin and ID does not match.",
                    requestingUser.getUsername(), userProfileQueryId);
            throw new AccessDeniedException("User does not have permission to access this profile.");
        }

        log.debug("Authorization successful for user {} to access profile for user ID {}. Mapping to DTO.",
                requestingUser.getUsername(), userProfileQueryId);

        // Map User entity to UserProfileDto
        UserProfileDto dto = new UserProfileDto();
        dto.setId(targetUser.getId());
        dto.setUserName(targetUser.getUsername()); // User.getUsername() returns userName field
        dto.setDesignation(targetUser.getDesignation());
        dto.setPassword(""); // Set password to empty string as per requirement
        dto.setUserTypeId(targetUser.getUserTypeID());
        dto.setIsActive(targetUser.getIsActive());
        dto.setPicture(targetUser.getPicture());
        dto.setContactId(targetUser.getContactId());
        dto.setIsAdmin(targetUser.getIsAdmin());
        dto.setFullName(targetUser.getFullName());
        dto.setCompanyId(targetUser.getCompanyID());
        dto.setIsSystemOwner(targetUser.getIsSystemOwner());

        log.info("Successfully mapped user ID {} to UserProfileDto", userProfileQueryId);
        return dto;
    }

    @Override
    @CacheEvict(value = "inspectorsNewFormatCache", allEntries = true)
    public UserProfileDto updateUserProfile(UserProfileUpdateDto dto, User requestingUser) {
        log.info("Attempting to update profile for user ID: {} by user: {}", dto.getId(), requestingUser.getUsername());

        // Authorization: Ensure the requesting user is an admin or is updating their own profile.
        if (!Boolean.TRUE.equals(requestingUser.getIsAdmin()) && !dto.getId().equals(requestingUser.getId())) {
            log.warn("Access denied for user {} attempting to update profile for user ID {}. User is not admin and ID does not match.",
                    requestingUser.getUsername(), dto.getId());
            throw new AccessDeniedException("User does not have permission to update this profile.");
        }

        User targetUser = findUserById(dto.getId()); // Throws EntityNotFoundException if not found

        // Username Uniqueness Check (only if username is provided and different)
        if (dto.getUserName() != null && !dto.getUserName().trim().isEmpty() && !dto.getUserName().equals(targetUser.getUsername())) {
            Optional<User> existingUserWithNewName = userRepository.findByUserName(dto.getUserName());
            if (existingUserWithNewName.isPresent() && !existingUserWithNewName.get().getId().equals(targetUser.getId())) {
                log.warn("Update failed for user ID {}: Username '{}' is already taken by user ID {}.",
                        targetUser.getId(), dto.getUserName(), existingUserWithNewName.get().getId());
                throw new UsernameConflictException("Please select a different user name and try again!");
            }
            targetUser.setUserName(dto.getUserName());
            log.debug("Username updated to '{}' for user ID {}", dto.getUserName(), targetUser.getId());
        }

        // Update FullName if provided
        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            targetUser.setFullName(dto.getFullName());
            log.debug("FullName updated for user ID {}", targetUser.getId());
        }

        // Update Designation if provided
        if (dto.getDesignation() != null && !dto.getDesignation().trim().isEmpty()) {
            targetUser.setDesignation(dto.getDesignation());
            log.debug("Designation updated for user ID {}", targetUser.getId());
        }

        // Update Password if provided and not empty (BCrypt instead of legacy DES)
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            targetUser.setPassword(passwordEncoder.encode(dto.getPassword()));
            log.debug("Password updated for user ID {}", targetUser.getId());
        }

        // Update UserTypeID if provided
        if (dto.getUserTypeId() != null) {
            targetUser.setUserTypeID(dto.getUserTypeId());
            log.debug("UserTypeID updated to {} for user ID {}", dto.getUserTypeId(), targetUser.getId());
        }

        // Update IsActive status if provided
        if (dto.getIsActive() != null) {
            targetUser.setIsActive(dto.getIsActive());
            log.debug("IsActive status updated to {} for user ID {}", dto.getIsActive(), targetUser.getId());
        }

        // Update Picture if provided
        if (dto.getPicture() != null && !dto.getPicture().trim().isEmpty()) {
            targetUser.setPicture(dto.getPicture());
            log.debug("Picture updated for user ID {}", targetUser.getId());
        }

        // Update ContactId if provided
        if (dto.getContactId() != null) {
            targetUser.setContactId(dto.getContactId());
            log.debug("ContactId updated to {} for user ID {}", dto.getContactId(), targetUser.getId());
        }

        // Sensitive Fields - update if provided. Add more granular security if needed.
        if (dto.getIsAdmin() != null) {
            targetUser.setIsAdmin(dto.getIsAdmin());
            log.debug("IsAdmin status updated to {} for user ID {}", dto.getIsAdmin(), targetUser.getId());
        }
        if (dto.getCompanyId() != null) {
            targetUser.setCompanyID(dto.getCompanyId());
            log.debug("CompanyID updated to {} for user ID {}", dto.getCompanyId(), targetUser.getId());
        }
        if (dto.getIsSystemOwner() != null) {
            targetUser.setIsSystemOwner(dto.getIsSystemOwner());
            log.debug("IsSystemOwner status updated to {} for user ID {}", dto.getIsSystemOwner(), targetUser.getId());
        }

        User updatedUser = userRepository.save(targetUser);
        log.info("Successfully updated profile for user ID: {}", updatedUser.getId());

        // Map updated User entity back to UserProfileDto for the response
        UserProfileDto responseDto = new UserProfileDto();
        responseDto.setId(updatedUser.getId());
        responseDto.setUserName(updatedUser.getUsername());
        responseDto.setDesignation(updatedUser.getDesignation());
        responseDto.setPassword(""); // Password is not returned
        responseDto.setUserTypeId(updatedUser.getUserTypeID());
        responseDto.setIsActive(updatedUser.getIsActive());
        responseDto.setPicture(updatedUser.getPicture());
        responseDto.setContactId(updatedUser.getContactId());
        responseDto.setIsAdmin(updatedUser.getIsAdmin());
        responseDto.setFullName(updatedUser.getFullName());
        responseDto.setCompanyId(updatedUser.getCompanyID());
        responseDto.setIsSystemOwner(updatedUser.getIsSystemOwner());

        return responseDto;
    }

    @Override
    @CacheEvict(value = "inspectorsNewFormatCache", allEntries = true)
    public UserProfileDto createUserProfile(CreateUserProfileDto dto) {
        log.info("Attempting to create a new user profile with username: {}", dto.getUserName());

        // Username Uniqueness Check
        Optional<User> existingUser = userRepository.findByUserName(dto.getUserName());
        if (existingUser.isPresent()) {
            log.warn("User creation failed: Username '{}' already exists.", dto.getUserName());
            throw new UsernameConflictException("Please select a different user name and try again!");
        }

        User newUser = new User();
        newUser.setUserName(dto.getUserName());
        newUser.setPassword(passwordEncoder.encode(dto.getPassword())); // BCrypt instead of legacy DES
        newUser.setUserTypeID(dto.getUserTypeId());
        newUser.setIsActive(dto.getIsActive());
        newUser.setContactId(dto.getContactId());

        // Optional fields
        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            newUser.setFullName(dto.getFullName());
        }
        if (dto.getDesignation() != null && !dto.getDesignation().trim().isEmpty()) {
            newUser.setDesignation(dto.getDesignation());
        }
        if (dto.getPicture() != null && !dto.getPicture().trim().isEmpty()) {
            newUser.setPicture(dto.getPicture());
        }
        // For boolean flags, if DTO provides a value, use it; otherwise, default to false.
        newUser.setIsAdmin(Boolean.TRUE.equals(dto.getIsAdmin())); // Defaults to false if dto.getIsAdmin() is null or false
        if (dto.getCompanyId() != null) {
            newUser.setCompanyID(dto.getCompanyId());
        }
        newUser.setIsSystemOwner(Boolean.TRUE.equals(dto.getIsSystemOwner())); // Defaults to false if dto.getIsSystemOwner() is null or false

        // Other fields like email, address, token fields will be null or default based on User entity definition

        User savedUser = userRepository.save(newUser);
        log.info("Successfully created new user with ID: {} and username: {}", savedUser.getId(), savedUser.getUsername());

        // Map saved User entity back to UserProfileDto for the response
        UserProfileDto responseDto = new UserProfileDto();
        responseDto.setId(savedUser.getId());
        responseDto.setUserName(savedUser.getUsername());
        responseDto.setDesignation(savedUser.getDesignation());
        responseDto.setPassword(""); // Password is not returned
        responseDto.setUserTypeId(savedUser.getUserTypeID());
        responseDto.setIsActive(savedUser.getIsActive());
        responseDto.setPicture(savedUser.getPicture());
        responseDto.setContactId(savedUser.getContactId());
        responseDto.setIsAdmin(savedUser.getIsAdmin());
        responseDto.setFullName(savedUser.getFullName());
        responseDto.setCompanyId(savedUser.getCompanyID());
        responseDto.setIsSystemOwner(savedUser.getIsSystemOwner());

        return responseDto;
    }

    @Override
    @CacheEvict(value = "inspectorsNewFormatCache", allEntries = true)
    public void deleteUserProfile(Integer userId) {
        log.info("Attempting to delete user profile with ID: {}", userId);

        if (!userRepository.existsById(userId)) {
            log.warn("User profile with ID: {} not found for deletion.", userId);
            // Use the exact message format provided by the user.
            throw new UserNotFoundForOperationException("Value cannot be null.\r\nParameter name: entity");
        }

        userRepository.deleteById(userId);
        log.info("Successfully deleted user profile with ID: {}", userId);
    }

    @Override
    public List<UserProfileDto> getAllUserProfiles() {
        log.info("Attempting to fetch all user profiles.");
        List<User> users = userRepository.findAll();

        if (users.isEmpty()) {
            log.info("No users found in the database.");
            return Collections.emptyList();
        }

        // Batch fetch contact names
        List<Integer> contactIds = users.stream()
                .map(User::getContactId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Integer, String> contactNamesMap = new HashMap<>();
        if (!contactIds.isEmpty()) {
            List<ContactBook> contacts = contactBookRepository.findAllById(contactIds);
            contacts.forEach(contact -> {
                if (contact.getName() != null) { // Ensure contact name is not null before putting
                    contactNamesMap.put(contact.getId(), contact.getName());
                }
            });
            log.debug("Fetched {} contact names for {} distinct contact IDs.", contactNamesMap.size(), contactIds.size());
        }

        List<UserProfileDto> dtos = new ArrayList<>();
        for (User user : users) {
            UserProfileDto dto = new UserProfileDto();
            dto.setId(user.getId());
            dto.setUserName(user.getUsername());
            dto.setDesignation(user.getDesignation());
            dto.setPassword(""); // Password is not returned
            dto.setUserTypeId(user.getUserTypeID());
            dto.setIsActive(user.getIsActive());
            dto.setPicture(user.getPicture());
            dto.setContactId(user.getContactId());
            dto.setIsAdmin(user.getIsAdmin());
            dto.setCompanyId(user.getCompanyID());
            dto.setIsSystemOwner(user.getIsSystemOwner());

            String fullName = "";
            if (user.getContactId() != null) {
                fullName = contactNamesMap.getOrDefault(user.getContactId(), "");
            }
            dto.setFullName(fullName);
            dtos.add(dto);
        }
        log.info("Successfully fetched and mapped {} user profiles.", dtos.size());
        return dtos;
    }

    // Helper replicating the old UserService.findUserById behavior.
    private User findUserById(Integer userId) {
        log.debug("Attempting to find user by ID: {}", userId);
        return userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found with ID: {}", userId);
                    return new EntityNotFoundException("User not found with ID: " + userId);
                });
    }
}
