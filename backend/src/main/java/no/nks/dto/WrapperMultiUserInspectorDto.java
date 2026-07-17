package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 检查员用户列表包装DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperMultiUserInspectorDto {
    
    /**
     * 检查员用户列表
     */
    private List<UserInspectorDto> multiUserInspectors;
} 