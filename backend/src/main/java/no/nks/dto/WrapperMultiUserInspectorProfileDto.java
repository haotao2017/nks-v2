package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 用户检查员配置列表包装DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperMultiUserInspectorProfileDto {
    
    /**
     * 用户检查员配置列表
     */
    private List<UserInspectorProfileDto> userInspectorProfiles;
} 