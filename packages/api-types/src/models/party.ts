/**
 * 项目参与方(party)与参与方文档域类型 —— 对齐后端 no.nks.dto 的 ProjectParty* / *PartyDocs* DTO。
 * 映射规则见 ../common.ts 顶部注释。
 */
import type { DocTypeDto } from './doc-type';
import type { ProjectChecklistInspDataDto } from './checklist-insp';

/** no.nks.dto.ProjectPartyDto。 */
export interface ProjectPartyDto {
  id?: number;
  projectId?: number;
  partyId?: number;
  partyTypeId?: number;
  partyTypeName?: string;
  partyName?: string;
  email?: string;
  contactNumber?: string;
}

/** no.nks.dto.ProjectPartyDetailsDto。 */
export interface ProjectPartyDetailsDto {
  partyId?: number;
  partyTypeId?: number;
  partyName?: string;
  partyTypeName?: string;
  email?: string;
}

/** no.nks.dto.WrapperProjectPartyDto。 */
export interface WrapperProjectPartyDto {
  projectParty?: ProjectPartyDto;
}

/** no.nks.dto.WrapperMultiProjectPartyDto。 */
export interface WrapperMultiProjectPartyDto {
  multiProjectParty?: ProjectPartyDto[];
}

/** no.nks.dto.ProjectPartyDocsDto。 */
export interface ProjectPartyDocsDto {
  id?: number;
  partyDocTypeId?: number;
  docName?: string;
  fileName?: string;
  date?: string;
  sortOrder?: number;
}

/** CountProjectPartyDocsUploaded 的内部静态类 DocumentCountByDocTypeIdDto。 */
export interface DocumentCountByDocTypeIdDto {
  docTypeID?: number;
  uploadedFilesCount?: number;
}

/** no.nks.dto.CountProjectPartyDocsUploaded。 */
export interface CountProjectPartyDocsUploaded {
  workflowId?: number;
  projectID?: number;
  partyID?: number;
  partyTypeID?: number;
  urlKey?: string;
  uploadedFilesCount?: number;
  documentsCountByDocType?: DocumentCountByDocTypeIdDto[];
}

/** no.nks.dto.ProjectSinglePartyDocsFilesListDto。@JsonIgnore 的 docName / date 不出现。 */
export interface ProjectSinglePartyDocsFilesListDto {
  id?: number;
  partyDocTypeId?: number;
  fileName?: string;
}

/** no.nks.dto.WrapperProjectPartyDocsMulti。 */
export interface WrapperProjectPartyDocsMulti {
  workflowId?: number;
  projectID?: number;
  partyID?: number;
  partyTypeID?: number;
  urlKey?: string;
  projectPartyDocsMulti?: DocTypeDto[];
}

/** no.nks.dto.WrapperProjectPartyDocsSingle。 */
export interface WrapperProjectPartyDocsSingle {
  workflowId?: number;
  projectID?: number;
  partyID?: number;
  partyTypeID?: number;
  urlKey?: string;
  projectPartyDocsSingle?: ProjectPartyDocsDto;
}

/** no.nks.dto.WrapperProjectPartyDocsInspection。 */
export interface WrapperProjectPartyDocsInspection {
  workflowId?: number;
  projectID?: number;
  partyID?: number;
  partyTypeID?: number;
  urlKey?: string;
  checklistItemIdCommaSeperated?: string;
  projectChecklistThirdPartyInspData?: ProjectChecklistInspDataDto;
}

/** no.nks.dto.WrapperProjectSinglePartyDocsUploadedFileList。 */
export interface WrapperProjectSinglePartyDocsUploadedFileList {
  workflowId?: number;
  projectID?: number;
  partyID?: number;
  partyTypeID?: number;
  urlKey?: string;
  filesList?: ProjectSinglePartyDocsFilesListDto[];
}
