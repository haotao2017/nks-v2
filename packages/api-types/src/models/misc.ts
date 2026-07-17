/**
 * 杂项主数据类型 —— 对齐 no.nks.dto.PostCodeDto / WrapperPostCodeDto。
 */

/** 邮编。字段名为挪威语原文(postnummer 等)。 */
export interface PostCodeDto {
  id?: number;
  postnummer?: string;
  poststed?: string;
  kommunenummer?: string;
  kommunenavn?: string;
  kategori?: string;
}

/** 邮编列表包装。 */
export interface WrapperPostCodeDto {
  postCodes?: PostCodeDto[];
}
