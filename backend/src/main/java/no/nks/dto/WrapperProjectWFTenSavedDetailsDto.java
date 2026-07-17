package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 项目工作流10步骤保存详情包装DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectWFTenSavedDetailsDto {
    
    /**
     * 项目工作流10步骤保存详情
     */
    private ProjectProjectWFTenSavedDetailsDto projectWFTenSavedDetails;
} 