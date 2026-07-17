/**
 * 参与方类型(PartyType)域类型 —— 对齐 no.nks.dto.PartyType* 系列 DTO。
 */

/**
 * 参与方类型。
 * sortOrder / companyID 为 @JsonIgnore,不出现在线上。
 * isDefault 通过 @JsonProperty("isDefault") 显式命名。
 */
export interface PartyTypeDto {
  id?: number;
  name?: string;
  isDefault?: boolean;
  workflowCategoryID?: number;
}

/** 创建/更新请求包装。 */
export interface PartyTypeRequestDto {
  partyType?: PartyTypeDto;
}

/** 响应包装。 */
export interface PartyTypeResponseDto {
  partyType?: PartyTypeDto;
}
