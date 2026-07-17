package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 项目参与方包装DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperProjectPartyDto {
    
    /**
     * 项目参与方
     */
    private ProjectPartyDto projectParty;
} 