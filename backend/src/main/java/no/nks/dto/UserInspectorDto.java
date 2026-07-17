package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 检查员用户DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInspectorDto {
    
    /**
     * 用户ID
     */
    private Integer id;
    
    /**
     * 职位
     */
    private String designation;
    
    /**
     * 用户类型ID
     */
    private Integer userTypeId;
    
    /**
     * 是否活跃
     */
    private Boolean isActive;
    
    /**
     * 联系人ID
     */
    private Integer contactId;
    
    /**
     * 公司ID
     */
    private Integer companyId;
    
    /**
     * 全名
     */
    private String fullName;
} 