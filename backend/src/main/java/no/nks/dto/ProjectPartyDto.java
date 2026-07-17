package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 项目参与方DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectPartyDto {
    
    /**
     * ID
     */
    private Integer id;
    
    /**
     * 项目ID
     */
    private Integer projectId;
    
    /**
     * 参与方ID
     */
    private Integer partyId;
    
    /**
     * 参与方类型ID
     */
    private Integer partyTypeId;
    
    /**
     * 参与方类型名称
     */
    private String partyTypeName;
    
    /**
     * 参与方名称
     */
    private String partyName;
    
    /**
     * 电子邮件
     */
    private String email;
    
    /**
     * 联系电话
     */
    private String contactNumber;
} 