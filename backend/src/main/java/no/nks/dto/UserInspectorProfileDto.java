package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户检查员配置DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInspectorProfileDto {
    
    /**
     * 用户ID
     */
    private Integer id;
    
    /**
     * 用户姓名
     */
    private String name;
    
    /**
     * 电子邮件
     */
    private String email;
    
    /**
     * 联系电话
     */
    private String contactNo;
} 