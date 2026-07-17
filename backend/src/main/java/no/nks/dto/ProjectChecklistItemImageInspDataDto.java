package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * 项目检查清单项图片检查数据DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectChecklistItemImageInspDataDto {
    
    /**
     * ID
     */
    private Integer id;
    
    /**
     * 检查清单项ID
     */
    private Integer checklistItemId;
    
    /**
     * 参与方ID
     */
    private Integer partyId;
    
    /**
     * 图片名称
     */
    private String imageName;
    
    /**
     * 图片类型
     */
    private String imageType;
    
    /**
     * 图片URL
     */
    private String imageURL;
    
    /**
     * 捕获日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private Date captureDate;
    
    /**
     * 是否适用于最终PDF
     */
    private Boolean isOkForFinalPdf;
} 