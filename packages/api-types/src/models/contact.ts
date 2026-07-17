/**
 * 联系人域类型 —— 对齐 no.nks.dto.Contact* 系列 DTO。
 */

/** 联系人。companyId 为 @JsonIgnore,不出现在线上。 */
export interface ContactDto {
  id?: number;
  name?: string;
  contactNo?: string;
  email?: string;
  companyName?: string;
}

/** 创建请求,根键 "Contact"(@JsonProperty 大写)。 */
export interface CreateContactRequest {
  Contact?: ContactDto;
}

/** 创建响应,根键 "contact"(@JsonProperty 小写)。 */
export interface CreateContactResponse {
  contact?: ContactDto;
}

/** 更新请求,根键 "Contact"(@JsonProperty 大写)。 */
export interface UpdateContactRequest {
  Contact?: ContactDto;
}

/** 删除响应。 */
export interface DeleteContactResponseDto {
  message?: string;
  success?: boolean;
}
