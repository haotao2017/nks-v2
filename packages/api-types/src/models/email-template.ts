/**
 * 邮件模板(EmailTemplate)域类型 —— 对齐 no.nks.dto.EmailTemplate* 系列 DTO。
 */

/** 邮件模板。companyId 为 @JsonIgnore,不出现在线上。 */
export interface EmailTemplateDto {
  id?: number;
  title?: string;
  template?: string;
}

/** 创建请求包装。 */
export interface CreateEmailTemplateRequest {
  emailTemplate?: EmailTemplateDto;
}

/** 创建响应包装。 */
export interface CreateEmailTemplateResponse {
  emailTemplate?: EmailTemplateDto;
}

/** 多个邮件模板响应。 */
export interface MultiEmailTemplatesResponse {
  multiEmailTemplates?: EmailTemplateDto[];
}

/** 删除响应。 */
export interface DeleteEmailTemplateResponseDto {
  message?: string;
  success?: boolean;
}
