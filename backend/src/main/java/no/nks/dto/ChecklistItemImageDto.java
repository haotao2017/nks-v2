package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 检查清单项图片DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemImageDto {
    
    private Integer id;
    private Integer checklistItemId;
    private String imageName;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private LocalDateTime captureDate;
    
    private String imageSize;
    private String imageType;
    private Integer partyId;
    private Boolean isOkForFinalPdf;
} 