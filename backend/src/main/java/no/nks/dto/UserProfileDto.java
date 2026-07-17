package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Integer id;
    private String userName;
    private String designation;
    private String password; // Will be set to "" in the service layer
    private Integer userTypeId;
    private Boolean isActive;
    private String picture;
    private Integer contactId;
    private Boolean isAdmin;
    private String fullName;
    private Integer companyId;
    private Boolean isSystemOwner;
}
