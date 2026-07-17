package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录请求。字段用 PascalCase 映射，保持与旧契约一致。
 */
@Data
@NoArgsConstructor
public class LoginRequestDto {

    @JsonProperty("UserName")
    @NotBlank(message = "UserName cannot be blank")
    private String userName;

    @JsonProperty("Password")
    @NotBlank(message = "Password cannot be blank")
    private String password;

    @JsonProperty("IsMobileApp")
    private Boolean isMobileApp = false;
}
