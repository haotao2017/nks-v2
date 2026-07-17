package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * 项目检查清单检查数据DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectChecklistInspDataDto {
    
    /**
     * ID
     */
    private Integer id;
    
    /**
     * 项目ID
     */
    private Integer projectId;
    
    /**
     * 检查清单名称
     */
    private String checklistName;
    
    /**
     * 开始日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private Date startDate;
    
    /**
     * 结束日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private Date endDate;
    
    /**
     * 备注
     */
    private String comment;
    
    /**
     * 检查清单项检查数据列表
     */
    private List<ProjectChecklistItemsInspDataDto> projectChecklistItemsInspData = new ArrayList<>();
    
    /**
     * 项目检查清单项目检查数据DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectChecklistItemsInspDataDto {
        private Integer id;
        private Integer checklistId;
        private String title;
        private String status;
        private String comment;
        private Boolean wasDev;
        
        /**
         * 修复日期
         */
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
        private Date fixDate;
        
        /**
         * 发送邮件给参与方日期
         */
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
        private Date emailPartyDate;
        
        /**
         * 参与方上传图片日期
         */
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
        private Date partyUploadedImgDate;
        
        /**
         * 发送给参与方的邮件模板ID
         */
        private String emailTempToPartiesIds;
        
        /**
         * 是否由参与方上传图片
         */
        private Boolean isImageUploadedByParty;
        
        private List<ProjectChecklistItemImageInspDataDto> projectChecklistItemImageInspData = new ArrayList<>();
    }
    
    /**
     * 项目检查清单项目图片检查数据DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectChecklistItemImageInspDataDto {
        private Integer id;
        private Integer checklistItemId;
        private String imageName;
        private String imageType;
        private LocalDateTime captureDate;
        private Integer partyId;
        
        /**
         * 是否适用于最终PDF
         */
        private Boolean isOkForFinalPdf;
        
        /**
         * 图片URL
         */
        private String imageURL;
    }
} 