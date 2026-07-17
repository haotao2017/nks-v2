/**
 * 检查清单域类型 —— 对齐后端 no.nks.dto 的 Checklist* / ProjectChecklist* DTO 线上 JSON 形状。
 * 映射规则见 ../common.ts 顶部注释。
 */

/** no.nks.dto.ChecklistItemImageDto。 */
export interface ChecklistItemImageDto {
  id?: number;
  checklistItemId?: number;
  imageName?: string;
  captureDate?: string;
  imageSize?: string;
  imageType?: string;
  partyId?: number;
  isOkForFinalPdf?: boolean;
}

/** no.nks.dto.ChecklistItemDto。 */
export interface ChecklistItemDto {
  id?: number;
  checklistId?: number;
  title?: string;
  sortOrder?: number;
  status?: string;
  comment?: string;
  fixDate?: string;
  wasDev?: boolean;
  emailPartyDate?: string;
  partyUploadedImgDate?: string;
  emailTempToPartiesIds?: string;
  isImageUploadedByParty?: boolean;
  images?: ChecklistItemImageDto[];
}

/** no.nks.dto.ChecklistItemSimpleDto —— 精简清单项。 */
export interface ChecklistItemSimpleDto {
  id?: number;
  checklistId?: number;
  title?: string;
}

/** no.nks.dto.ProjectChecklistDto —— 项目检查清单主体。 */
export interface ProjectChecklistDto {
  id?: number;
  projectId?: number;
  sortOrder?: number;
  checklistName?: string;
  startDate?: string;
  endDate?: string;
  comment?: string;
  checklistItems?: ChecklistItemDto[];
  projectChecklistItems?: ChecklistItemSimpleDto[];
}

/**
 * no.nks.dto.ProjectChecklistDetailDto。
 * 注意:后端 projectChecklistItems 承载的是 ChecklistItemSimpleDto[]。
 */
export interface ProjectChecklistDetailDto {
  id?: number;
  projectId?: number;
  checklistName?: string;
  projectChecklistItems?: ChecklistItemSimpleDto[];
}

/**
 * no.nks.dto.ProjectChecklistSimpleDto。
 * 后端 projectChecklistItems 恒为 null(Object 字段),线上表现为 null。
 */
export interface ProjectChecklistSimpleDto {
  id?: number;
  projectId?: number;
  checklistName?: string;
  projectChecklistItems?: null;
}

/** no.nks.dto.ChecklistItemTemplateDto —— top-level(注意与 dto/api 同名类区分,见 mobile.ts 的 ApiChecklistItemTemplateDto)。@JsonIgnore sortOrder 不出现。 */
export interface ChecklistItemTemplateDto {
  id?: number;
  checklistId?: number;
  title?: string;
}

/** no.nks.dto.ServiceItemTemplateDto。 */
export interface ServiceItemTemplateDto {
  id?: number;
  serviceTypeId?: number;
  name?: string;
  rate?: string;
  description?: string;
  serviceChargedAs?: number;
  checklistTempId?: number;
}

/** no.nks.dto.ChecklistTemplateDto —— top-level(注意与 dto/api 同名类区分,见 mobile.ts 的 ApiChecklistTemplateDto)。@JsonIgnore sortOrder 不出现。 */
export interface ChecklistTemplateDto {
  id?: number;
  title?: string;
  isDefault?: boolean;
  serviceSelectedID?: number;
  checklistItemTemplateList?: ChecklistItemTemplateDto[];
  checkListAttchedWithService?: ServiceItemTemplateDto;
}

/** no.nks.dto.ChecklistTemplateWrapperDto。 */
export interface ChecklistTemplateWrapperDto {
  checklistTemplate?: ChecklistTemplateDto;
}

/** no.nks.dto.ChecklistItemTemplateWrapperDto。 */
export interface ChecklistItemTemplateWrapperDto {
  checklistItemTemplate?: ChecklistItemTemplateDto;
}

/** no.nks.dto.WrapperProjectChecklistDto。 */
export interface WrapperProjectChecklistDto {
  projectChecklist?: ProjectChecklistDto;
}

/** no.nks.dto.WrapperMultiProjectChecklistDto。 */
export interface WrapperMultiProjectChecklistDto {
  multiProjectChecklist?: ProjectChecklistDto[];
}

/** no.nks.dto.WrapperMultiProjectChecklistSimpleDto。 */
export interface WrapperMultiProjectChecklistSimpleDto {
  multiProjectChecklist?: ProjectChecklistSimpleDto[];
}

/** no.nks.dto.WrapperProjectChecklistDetailDto。 */
export interface WrapperProjectChecklistDetailDto {
  projectChecklist?: ProjectChecklistDetailDto;
}

/** no.nks.dto.WrapperProjectChecklistItemDto。 */
export interface WrapperProjectChecklistItemDto {
  projectChecklistItems?: ChecklistItemDto;
}

/** no.nks.dto.WrapperChecklistItemSimpleDto。 */
export interface WrapperChecklistItemSimpleDto {
  projectChecklistItems?: ChecklistItemSimpleDto;
}
