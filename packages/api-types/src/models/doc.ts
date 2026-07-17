/**
 * 项目文档域类型 —— 对齐后端 no.nks.dto 的 ProjectDocument* / ConvertToPdf* 及 dto/api.InspectionLogDto。
 * 映射规则见 ../common.ts 顶部注释。
 */

/** no.nks.dto.ProjectDocumentDto。多字段带 @JsonProperty,线上名以其为准。 */
export interface ProjectDocumentDto {
  documentID?: number;
  partyID?: number;
  partyTypeID?: number;
  documenTypeId?: number;
  fileName?: string;
  date?: string;
  documentName?: string;
  projectPartyID?: number;
  imageURL?: string;
  workflowStepId?: number;
  workflowStepName?: string;
  isRequired?: boolean;
  isApproved?: boolean;
}

/**
 * no.nks.dto.ProjectDocumentUploadDto。
 * 字段带 @JsonAlias(大小写变体),此处用规范 camelCase 名;后端反序列化大小写不敏感。
 */
export interface ProjectDocumentUploadDto {
  projectId?: number;
  workflowId?: number;
  partyId?: number;
  partyTypeId?: number;
  documenTypeId?: number;
  otherDocs?: number;
  fileName?: string;
  insertDate?: string;
  insertedBy?: number;
}

/** no.nks.dto.WrapperProjectDocumentDto。 */
export interface WrapperProjectDocumentDto {
  projectId?: number;
  workflowId?: number;
  workflowStepId?: number;
  projectDocumentList?: ProjectDocumentDto[];
}

/** no.nks.dto.WrapperProjectDocumentUploadDto。 */
export interface WrapperProjectDocumentUploadDto {
  projectDocumentUpload?: ProjectDocumentUploadDto;
}

/** no.nks.dto.ConvertToPdfRequest。 */
export interface ConvertToPdfRequest {
  content?: string;
}

/** no.nks.dto.ConvertToPdfResponse。 */
export interface ConvertToPdfResponse {
  fileUrl?: string;
}

/**
 * no.nks.dto.api.InspectionLogDto。
 * 后端字段为 PascalCase(Id/ProjectId/DateTime)且无 @JsonProperty,Jackson 按 getter 派生
 * 线上名为 camelCase → id / projectId / dateTime。
 */
export interface InspectionLogDto {
  id?: number;
  projectId?: number;
  dateTime?: string;
}
