package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import no.nks.entity.User;

/**
 * 用户数据传输对象，用于API响应，不包含敏感信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Integer id;
    private String fullName;
    private String userName;
    private String designation;
    private String email;
    private Integer userTypeID;
    private String address;
    private String contactNo;
    private Boolean isActive;
    private String picture;
    private Integer contactId;
    private Boolean isAdmin;
    private Integer companyID;
    private Boolean isSystemOwner;

    /**
     * 从User实体创建UserDto，隐藏敏感信息
     * @param user User实体
     * @return UserDto实例
     */
    public static UserDto fromEntity(User user) {
        if (user == null) {
            return null;
        }

        return new UserDto(
            user.getId(),
            user.getFullName(),
            user.getUsername(),
            user.getDesignation(),
            user.getEmail(),
            user.getUserTypeID(),
            user.getAddress(),
            user.getContactNo(),
            user.getIsActive(),
            user.getPicture(),
            user.getContactId(),
            user.getIsAdmin(),
            user.getCompanyID(),
            user.getIsSystemOwner()
        );
    }
}
