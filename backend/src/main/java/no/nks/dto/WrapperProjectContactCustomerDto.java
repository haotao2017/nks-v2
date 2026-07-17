package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 项目联系客户包装DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectContactCustomerDto {
    
    /**
     * 联系客户信息
     */
    private ProjectContactCustomerDto contactCustomer;
} 