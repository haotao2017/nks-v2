package no.nks.service;

import no.nks.dto.CreateUserProfileDto;
import no.nks.dto.UserProfileDto;
import no.nks.dto.UserProfileUpdateDto;
import no.nks.entity.User;

import java.util.List;

public interface UserProfileService {

    UserProfileDto getUserProfile(Integer userProfileQueryId, User requestingUser);

    UserProfileDto updateUserProfile(UserProfileUpdateDto dto, User requestingUser);

    UserProfileDto createUserProfile(CreateUserProfileDto dto);

    void deleteUserProfile(Integer userId);

    List<UserProfileDto> getAllUserProfiles();
}
