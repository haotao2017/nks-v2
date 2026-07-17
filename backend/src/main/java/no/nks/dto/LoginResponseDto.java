package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应。字段与旧契约一致（Password 有意省略）。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDto {
    private Integer id;
    private String fullName;
    private String userName;
    private String token;
    private Boolean isAdmin;
    private Boolean isMobileApp;
    private Integer companyID;
}
