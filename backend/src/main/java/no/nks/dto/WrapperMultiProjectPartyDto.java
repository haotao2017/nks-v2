package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 项目多参与方包装DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperMultiProjectPartyDto {
    
    /**
     * 项目参与方列表
     */
    private List<ProjectPartyDto> multiProjectParty;
} 