package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * 项目检查清单DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectChecklistDto {
    
    private Integer id;
    private Integer projectId;
    private Integer sortOrder;
    private String checklistName;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime endDate;
    
    private String comment;
    
    @JsonProperty("checklistItems")
    private List<ChecklistItemDto> checklistItems = new ArrayList<>();
    
    @JsonProperty("projectChecklistItems")
    private List<ChecklistItemSimpleDto> projectChecklistItems = new ArrayList<>();
    
    /**
     * 设置检查清单项列表
     */
    public void setChecklistItems(List<ChecklistItemDto> checklistItems) {
        this.checklistItems = checklistItems != null ? checklistItems : new ArrayList<>();
    }
    
    /**
     * 设置简化版检查清单项列表
     */
    public void setProjectChecklistItems(List<ChecklistItemSimpleDto> projectChecklistItems) {
        this.projectChecklistItems = projectChecklistItems != null ? projectChecklistItems : new ArrayList<>();
    }
} 