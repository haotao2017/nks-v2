package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * 项目联系客户DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectContactCustomerDto {
    
    /**
     * 项目ID
     */
    private Integer projectId;
    
    /**
     * 联系客户日期
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SS'Z'", timezone = "UTC", shape = JsonFormat.Shape.STRING)
    private Date contactCustomerDate;
} 