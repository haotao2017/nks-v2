/**
 * 检查清单"检查数据"(inspection data)域类型 —— 对齐后端 no.nks.dto 的 *InspData* DTO。
 * 映射规则见 ../common.ts 顶部注释。
 */

/** no.nks.dto.ProjectChecklistItemImageInspDataDto。 */
export interface ProjectChecklistItemImageInspDataDto {
  id?: number;
  checklistItemId?: number;
  partyId?: number;
  imageName?: string;
  imageType?: string;
  imageURL?: string;
  captureDate?: string;
  isOkForFinalPdf?: boolean;
}

/** no.nks.dto.ProjectChecklistItemsInspDataDto。 */
export interface ProjectChecklistItemsInspDataDto {
  id?: number;
  checklistId?: number;
  title?: string;
  status?: string;
  comment?: string;
  fixDate?: string;
  wasDev?: boolean;
  emailPartyDate?: string;
  partyUploadedImgDate?: string;
  emailTempToPartiesIds?: string;
  isImageUploadedByParty?: boolean;
  projectChecklistItemImageInspData?: ProjectChecklistItemImageInspDataDto[];
}

/**
 * no.nks.dto.ProjectChecklistInspDataDto。
 * 注意:后端 projectChecklistItemsInspData 用的是该类内部的静态嵌套类,与顶层
 * ProjectChecklistItemsInspDataDto 字段结构一致,故此处直接复用顶层接口。
 */
export interface ProjectChecklistInspDataDto {
  id?: number;
  projectId?: number;
  checklistName?: string;
  startDate?: string;
  endDate?: string;
  comment?: string;
  projectChecklistItemsInspData?: ProjectChecklistItemsInspDataDto[];
}

/**
 * no.nks.dto.ProjectChecklistInspDataENT。
 * 后端源码文件为空(无类体/无字段),线上无稳定形状 → 空对象占位。
 */
export interface ProjectChecklistInspDataENT {
  [key: string]: unknown;
}

/** no.nks.dto.WrapperMultiProjectChecklistInspDataDto。 */
export interface WrapperMultiProjectChecklistInspDataDto {
  multiProjectChecklistInspData?: ProjectChecklistInspDataDto[];
}

/** no.nks.dto.WrapperProjectChecklistItemInspDataDto。 */
export interface WrapperProjectChecklistItemInspDataDto {
  projectChecklistItemInspData?: ProjectChecklistItemsInspDataDto;
}
