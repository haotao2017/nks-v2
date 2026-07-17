package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

/**
 * 项目检查清单项检查数据DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectChecklistItemsInspDataDto {
    
    /**
     * ID
     */
    private Integer id;
    
    /**
     * 检查清单ID
     */
    private Integer checklistId;
    
    /**
     * 标题
     */
    private String title;
    
    /**
     * 状态
     */
    private String status;
    
    /**
     * 备注
     */
    private String comment;
    
    /**
     * 修复日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private Date fixDate;
    
    /**
     * 是否有开发
     */
    private Boolean wasDev;
    
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
    
    /**
     * 检查清单项图片检查数据列表
     */
    private List<ProjectChecklistItemImageInspDataDto> projectChecklistItemImageInspData;
} 