package no.nks.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateDto {

    @NotNull(message = "ID is required to identify the user profile for update.")
    private Integer id;

    private String userName;
    private String designation;
    private String password; // Optional, if blank or null, password is not updated
    private Integer userTypeId;
    private Boolean isActive;
    private String picture;
    private Integer contactId;
    private Boolean isAdmin;
    private String fullName;
    private Integer companyId;
    private Boolean isSystemOwner;
}
