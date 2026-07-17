/**
 * 文档类型(DocType)域类型。
 * DocTypeDto 来自 no.nks.dto.DocTypeDto(兼容 C# 响应形状)。
 * WrapperDocType / WrapperMultiDocTypes 来自 no.nks.entity,包裹的是 DocType 实体。
 */

/** 文档类型 DTO(C# 兼容形状)。 */
export interface DocTypeDto {
  docTypeId?: number;
  docName?: string;
  isRequired?: boolean;
}

/**
 * DocType 实体的线上形状(WrapperDocType 内包裹的类型)。
 * sortOrder / companyId 为 @JsonIgnore,不出现在线上。
 */
export interface DocType {
  id?: number;
  partyTypeId?: number;
  docName?: string;
  isRequired?: boolean;
}

/** 单个 DocType 实体包装。 */
export interface WrapperDocType {
  docType?: DocType;
}

/** 多个 DocType 实体包装。 */
export interface WrapperMultiDocTypes {
  multiDocTypes?: DocType[];
}
