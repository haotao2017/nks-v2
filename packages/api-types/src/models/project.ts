/**
 * 项目核心域类型 —— 对齐后端 no.nks.dto 的 Project* DTO 线上 JSON 形状。
 * 映射规则见 ../common.ts 顶部注释。
 */
import type { ServiceDto, ServiceWorkflowCategoryDto } from './service';

/** no.nks.dto.ProjectDto —— 项目主实体。@JsonIgnore 的 companyId / userId 不出现。 */
export interface ProjectDto {
  id?: number;
  vismaId?: string;
  title?: string;
  dated?: string;
  customerId?: number;
  contactPersonId?: number;
  buildingSupplierId?: number;
  gardsNo?: string;
  bruksnmmer?: string;
  address?: string;
  postNo?: string;
  poststed?: string;
  kommune?: string;
  comments?: string;
  inspectorId?: number;
  projectLeaderId?: number;
  remContactCustomerDate?: string;
  description?: string;
  completeDate?: string;
  isSubmitted?: boolean;
  longitude?: string;
  latitude?: string;
  inspectionEventComment?: string;
  inspectionDate?: string;
  godkjensDate?: string;
  projectStatus?: string;
  projectImage?: string;
  inspectorComment?: string;
  inspectorSignature?: string;
  takkBestillingenCdate?: string;
  soknadOmAnsvarsrettCdate?: string;
  ansvarligSokerCdate?: string;
  gratulererGodkjentCdate?: string;
  createChecklistCdate?: string;
  addPartiesCdate?: string;
  setProLeaderContactCustomerCdate?: string;
  emailCustomerUpInspectionCd?: string;
  upcomingInspectionCdate?: string;
  partiesDataCdate?: string;
  assignInspectorCdate?: string;
  projectSubProcessCdate?: string;
  projectSubCompleteCd?: string;
  reviewInspReportCd?: string;
  invoiceSetCd?: string;
  submitInspectionRepRemindCd?: string;
  submitInspectionRepRemindAgainCd?: string;
  kontrollerklaeringPdfCd?: string;
  finalReportPdfCdate?: string;
  modifiedDate?: string;
  invoiceSetDate?: string;
  isDeleted?: boolean;
  isArchived?: boolean;
  isApprovedInspReport?: boolean;
  takkBestillingenIsCompleted?: boolean;
  soknadOmAnsvarsrettIsCompleted?: boolean;
  ansvarligSokerIsCompleted?: boolean;
  gratulererGodkjentIsCompleted?: boolean;
  createChecklistIsCompleted?: boolean;
  addPartiesIsCompleted?: boolean;
  setProLeaderContactCustomerIsCompleted?: boolean;
  emailCustomerUpInspectionIsCompleted?: boolean;
  partiesDataIsCompleted?: boolean;
  assignInspectorIsCompleted?: boolean;
  isApprovedInspReportIsCompleted?: boolean;
  vismaInvoiceId?: string;
  invoiceTripletexID?: string;
  tepmlateValue?: string;
  avvik?: string;
  avvikSendtKommune?: boolean;
  skipInspection?: boolean;
  // 关联实体，后端声明为 Object，线上形状不固定 → unknown
  customer?: unknown;
  contactPerson?: unknown;
  buildingSupplier?: unknown;
  projectService?: ProjectServiceDto[];
  projectServiceWorkflowList?: ServiceWorkflowCategoryDto[];
  projectParties?: unknown;
}

/** no.nks.dto.ProjectListDto —— 列表精简项。 */
export interface ProjectListDto {
  id?: number;
  title?: string;
  dated?: string;
}

/** no.nks.dto.ProjectCountDto —— 项目计数统计。 */
export interface ProjectCountDto {
  notArchivedOrDeleted?: number;
  deleted?: number;
  archived?: number;
}

/** no.nks.dto.DeleteProjectResponseDto。 */
export interface DeleteProjectResponseDto {
  message?: string;
  success?: boolean;
}

/** no.nks.dto.ProjectContactCustomerDto。 */
export interface ProjectContactCustomerDto {
  projectId?: number;
  contactCustomerDate?: string;
}

/** no.nks.dto.WrapperProjectContactCustomerDto。 */
export interface WrapperProjectContactCustomerDto {
  contactCustomer?: ProjectContactCustomerDto;
}

/** no.nks.dto.ProjectProjectLeaderDto。 */
export interface ProjectProjectLeaderDto {
  projectId?: number;
  projectLeaderID?: number;
}

/** no.nks.dto.WrapperProjectLeaderDto。 */
export interface WrapperProjectLeaderDto {
  projectLeader?: ProjectProjectLeaderDto;
}

/** no.nks.dto.ProjectServiceDto。 */
export interface ProjectServiceDto {
  id?: number;
  projectId?: number;
  serviceId?: number;
  quantity?: number;
  price?: string;
  isNewAdded?: boolean;
  service?: ServiceDto;
}

/** no.nks.dto.WrapperProjectDto。 */
export interface WrapperProjectDto {
  project?: ProjectDto;
}

/** no.nks.dto.WrapperMultiProjectDto。 */
export interface WrapperMultiProjectDto {
  multiProject?: ProjectDto[];
}

/** no.nks.dto.WrapperMultiProjectListDto。 */
export interface WrapperMultiProjectListDto {
  multiProject?: ProjectListDto[];
}

/** no.nks.dto.ProjectProjectWFTenSavedDetailsDto。 */
export interface ProjectProjectWFTenSavedDetailsDto {
  projectId?: number;
  inspectorId?: number;
  inspectorName?: string;
  inspectionDate?: string;
  inspectionEventComment?: string;
  skipInspection?: boolean;
}

/** no.nks.dto.WrapperProjectWFTenSavedDetailsDto。 */
export interface WrapperProjectWFTenSavedDetailsDto {
  projectWFTenSavedDetails?: ProjectProjectWFTenSavedDetailsDto;
}
