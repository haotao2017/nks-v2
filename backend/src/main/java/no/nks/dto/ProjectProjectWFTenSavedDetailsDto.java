package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * 项目工作流10步骤保存详情DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectProjectWFTenSavedDetailsDto {
    
    /**
     * 项目ID
     */
    private Integer projectId;
    
    /**
     * 检查员ID
     */
    private Integer inspectorId;
    
    /**
     * 检查员姓名
     */
    private String inspectorName;
    
    /**
     * 检查日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private Date inspectionDate;
    
    /**
     * 检查事件备注
     */
    private String inspectionEventComment;
    
    /**
     * 是否跳过检查
     */
    private Boolean skipInspection;
} 