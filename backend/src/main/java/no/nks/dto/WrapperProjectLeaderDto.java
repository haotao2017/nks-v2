package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 项目负责人包装DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectLeaderDto {
    
    /**
     * 项目负责人信息
     */
    private ProjectProjectLeaderDto projectLeader;
} 