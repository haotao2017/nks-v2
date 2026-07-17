package no.nks.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserProfileDto {

    @NotBlank(message = "UserName is required.")
    private String userName;

    @NotBlank(message = "Password is required.")
    private String password;

    @NotNull(message = "UserTypeId is required.")
    private Integer userTypeId;

    @NotNull(message = "IsActive status is required.")
    private Boolean isActive;

    @NotNull(message = "ContactId is required.")
    private Integer contactId;

    // Optional fields
    private String designation;
    private String picture;
    private Boolean isAdmin; // Defaults to false in service if not provided
    private String fullName;
    private Integer companyId;
    private Boolean isSystemOwner; // Defaults to false in service if not provided
}
