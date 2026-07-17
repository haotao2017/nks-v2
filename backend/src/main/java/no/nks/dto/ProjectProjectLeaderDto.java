package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 项目负责人DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectProjectLeaderDto {
    
    /**
     * 项目ID
     */
    private Integer projectId;
    
    /**
     * 项目负责人ID
     */
    private Integer projectLeaderID;
} 