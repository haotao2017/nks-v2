package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserProfileRequest {

    @JsonProperty("userProfile") // Ensures the JSON root key is "userProfile"
    @Valid
    @NotNull(message = "UserProfile data is required for creation.")
    private CreateUserProfileDto userProfile;
}
