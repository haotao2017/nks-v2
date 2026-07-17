package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文档类型DTO
 * 用于匹配C#版本的响应格式
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocTypeDto {
    private Integer docTypeId;
    private String docName;
    private Boolean isRequired;
}
