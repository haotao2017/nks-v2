package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 检查清单项DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemDto {
    
    private Integer id;
    private Integer checklistId;
    private String title;
    private Integer sortOrder;
    private String status;
    private String comment;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime fixDate;
    
    private Boolean wasDev;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime emailPartyDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime partyUploadedImgDate;
    
    private String emailTempToPartiesIds;
    private Boolean isImageUploadedByParty;
    
    private List<ChecklistItemImageDto> images = new ArrayList<>();
} 