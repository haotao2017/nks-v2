/**
 * 项目工作流域类型 —— 对齐后端 no.nks.dto.workflow 全部 DTO 的线上 JSON 形状。
 * 映射规则见 ../common.ts 顶部注释。
 */

/** no.nks.dto.workflow.EmailProjectPartiesWorkflowEntDto。 */
export interface EmailProjectPartiesWorkflowEntDto {
  partyID?: number;
  partyTypeID?: number;
  partyName?: string;
  partyTypeName?: string;
  content?: string;
  title?: string;
  emailTo?: string;
  emailFrom?: string;
  sendEmail?: boolean;
  urlKey?: string;
}

/** no.nks.dto.workflow.EmailProjectPartiesWorkflowDto。 */
export interface EmailProjectPartiesWorkflowDto {
  emailProjectPartiesWorkflowList?: EmailProjectPartiesWorkflowEntDto[];
  partyId?: number;
}

/** no.nks.dto.workflow.EmailProjectPartiesSentDto。 */
export interface EmailProjectPartiesSentDto {
  partyID?: number;
  partyTypeID?: number;
  emailContent?: string;
  emailFrom?: string;
  emailTo?: string;
  emailSubject?: string;
}

/** no.nks.dto.workflow.ProjectWorkflowDto。 */
export interface ProjectWorkflowDto {
  id?: number;
  projectId?: number;
  workflowId?: number;
  workflowStepId?: number;
  serviceWorkflowCategoryId?: number;
  isTransfer?: boolean;
  emailHistoryId?: number;
  insertDate?: string;
  insertedBy?: number;
  taskId?: number;
  emailContent?: string;
  emailSubject?: string;
  emailTo?: string;
  cc?: string;
  projectLeaderEmailTo?: string;
  emailFrom?: string;
  attachmentURL?: string;
  attachmentURLs?: string[];
  fileName?: string;
  fileNames?: string[];
  rootURL?: string;
  emailTempId?: number;
  contactCustomerDate?: string;
  emailProjectParties?: EmailProjectPartiesWorkflowDto;
  baseURLSite?: string;
  projectInspectionEventComment?: string;
  projectInspectorId?: number;
  projectInspectionDate?: string;
  projectSkipInspection?: boolean;
  isInspectorEmail?: boolean;
  isApprovedInspReport?: boolean;
  checklistItemIdCommaSeperated?: string;
  tepmlateValue?: string;
  avvik?: string;
  avvikSendtKommune?: string;
  emailProjectPartiesSent?: EmailProjectPartiesSentDto[];
  partyId?: number;
  partyTypeId?: number;
  urlKey?: string;
  toEmail?: string;
  fromEmail?: string;
  fileUrl?: string;
  fileUrls?: string[];
}

/** no.nks.dto.workflow.WrapperProjectWorkflowDto。@JsonProperty("ProjectWorkflow") → 线上名为 PascalCase。 */
export interface WrapperProjectWorkflowDto {
  ProjectWorkflow?: ProjectWorkflowDto;
}

/** no.nks.dto.workflow.WrapperMultiProjectWorkflowDto。 */
export interface WrapperMultiProjectWorkflowDto {
  multiProjectWorkflow?: ProjectWorkflowDto[];
}

/** no.nks.dto.workflow.ProjectInvoiceDataDto。 */
export interface ProjectInvoiceDataDto {
  projectId?: number;
  workflowId?: number;
  workflowStepId?: number;
  invoiceDetails?: string;
  amount?: number;
}

/** no.nks.dto.workflow.WrapperProjectInvoiceDataDto。 */
export interface WrapperProjectInvoiceDataDto {
  projectInvoiceDataENT?: ProjectInvoiceDataDto;
}
