/**
 * 移动端读模型 —— 对齐后端 no.nks.dto.api 包(旧移动 API 契约)的线上 JSON 形状。
 * 映射规则见 ../common.ts 顶部注释。
 *
 * 命名说明:dto/api 下多数 DTO 字段为 PascalCase(如 ProjectID / Status / ListOfProjects)
 * 且未标注 @JsonProperty。后端未配置字段可见性或命名策略(仅开启反序列化大小写不敏感),
 * 故 Jackson 按 getter 名派生序列化字段名 → 首字母小写的 camelCase(ProjectID→projectID,
 * Status→status,ListOfProjects→listOfProjects)。本文件字段名即按此派生结果。
 *
 * 同名冲突:dto/api 下的 ChecklistTemplateDto / ChecklistItemTemplateDto 与 top-level
 * (checklist.ts)同名但结构不同,此处重命名为 ApiChecklistTemplateDto /
 * ApiChecklistItemTemplateDto 以避免 barrel 冲突。
 */

/** no.nks.dto.api.Response。 */
export interface Response {
  status?: string;
  message?: string;
}

/** no.nks.dto.api.Login(dto/api 版,与 top-level LoginRequestDto/LoginResponseDto 无关)。 */
export interface Login {
  projectID?: string;
  projectName?: string;
  projectDetail?: string;
  inspectionDate?: string;
}

/** no.nks.dto.api.ResponseContainer。 */
export interface ResponseContainer {
  response?: Response;
  listOfProjects?: Login[];
}

/** no.nks.dto.api.ProjectUpdateENT。 */
export interface ProjectUpdateENT {
  projectID?: number;
  projectDescription?: string;
  projectDate?: string;
}

/** no.nks.dto.api.ProjectContainer。 */
export interface ProjectContainer {
  projectUpdate?: ProjectUpdateENT;
}

/** no.nks.dto.api.ProjectDetailModCls。 */
export interface ProjectDetailModCls {
  projectId?: number;
  projectTitle?: string;
  description?: string;
  address?: string;
  createdOn?: string;
  latitude?: string;
  longitude?: string;
  leaderName?: string;
  leaderNumber?: string;
  flislegerName?: string;
  flislegerNumber?: string;
  siteImageUrl?: string;
  floorPlanUrl?: string;
}

/** no.nks.dto.api.ProjectChecklists。 */
export interface ProjectChecklists {
  checklistId?: number;
  checklistName?: string;
  checklistItemTypes?: number;
}

/** no.nks.dto.api.ProjectDetailContainer。 */
export interface ProjectDetailContainer {
  response?: Response;
  projectDetail?: ProjectDetailModCls;
  listOfChecklists?: ProjectChecklists[];
}

/** no.nks.dto.api.ChecklistItemList。 */
export interface ChecklistItemList {
  checklistItemID?: number;
  question?: string;
  comment?: string;
  status?: string;
  itemImageUrls?: string[];
}

/** no.nks.dto.api.ChecklistItemContainer。 */
export interface ChecklistItemContainer {
  response?: Response;
  listOfChecklistItems?: ChecklistItemList[];
}

/** no.nks.dto.api.ChecklistItemData。 */
export interface ChecklistItemData {
  id?: number;
  title?: string;
  sortOrder?: number;
  status?: string;
}

/** no.nks.dto.api.ChecklistItemRequestENT。 */
export interface ChecklistItemRequestENT {
  projectID?: number;
  checkListID?: number;
  questionID?: number;
  status?: string;
  comment?: string;
}

/** no.nks.dto.api.ChecklistItemUpdateContainer。 */
export interface ChecklistItemUpdateContainer {
  checklistItem?: ChecklistItemRequestENT;
}

/** no.nks.dto.api.ChecklistItemUpdateResponseData。 */
export interface ChecklistItemUpdateResponseData {
  projectID?: number;
  checklistID?: number;
  questionID?: number;
}

/** no.nks.dto.api.ChecklistItemUpdateResponse。 */
export interface ChecklistItemUpdateResponse {
  response?: Response;
  checklistItemUpdate?: ChecklistItemUpdateResponseData;
}

/** no.nks.dto.api.ChecklistItemTemplateDto(来源 dto/api,重命名以区分 top-level 同名类)。 */
export interface ApiChecklistItemTemplateDto {
  id?: number;
  title?: string;
  sortOrder?: number;
}

/** no.nks.dto.api.ChecklistTemplateDto(来源 dto/api,重命名以区分 top-level 同名类)。 */
export interface ApiChecklistTemplateDto {
  id?: number;
  title?: string;
  isDefault?: boolean;
  sortOrder?: number;
  items?: ApiChecklistItemTemplateDto[];
}

/** no.nks.dto.api.ChecklistTemplateContainer。 */
export interface ChecklistTemplateContainer {
  response?: Response;
  listOfTemplates?: ApiChecklistTemplateDto[];
}

/** no.nks.dto.api.CreateChecklistItemRequest。 */
export interface CreateChecklistItemRequest {
  title?: string;
  sortOrder?: number;
}

/** no.nks.dto.api.CreateChecklistFromTemplateRequest。 */
export interface CreateChecklistFromTemplateRequest {
  checklistName?: string;
  templateIds?: number[];
  customChecklistItems?: CreateChecklistItemRequest[];
}

/** no.nks.dto.api.CreateChecklistWithProjectData。 */
export interface CreateChecklistWithProjectData {
  projectId?: number;
  projectTitle?: string;
  checklistId?: number;
  checklistName?: string;
  checklistItems?: ChecklistItemData[];
}

/** no.nks.dto.api.CreateChecklistWithProjectRequest。 */
export interface CreateChecklistWithProjectRequest {
  projectTitle?: string;
  projectDescription?: string;
  address?: string;
  postNo?: string;
  poststed?: string;
  kommune?: string;
  comments?: string;
  customerId?: number;
  contactPersonId?: number;
  longitude?: string;
  latitude?: string;
  checklistName?: string;
  checklistComment?: string;
  checklistItems?: CreateChecklistItemRequest[];
}

/** no.nks.dto.api.CreateChecklistWithProjectResponse。 */
export interface CreateChecklistWithProjectResponse {
  response?: Response;
  data?: CreateChecklistWithProjectData;
}

/** no.nks.dto.api.ProjectSubmitENT。 */
export interface ProjectSubmitENT {
  projectID?: number;
  inspectorComments?: string;
  inspectorSignature?: string;
  projectSubmitDate?: string;
}

/** no.nks.dto.api.ProjectSubmitContainer。 */
export interface ProjectSubmitContainer {
  projectSubmit?: ProjectSubmitENT;
}

/** no.nks.dto.api.QuickCreateProjectRequest。 */
export interface QuickCreateProjectRequest {
  projectTitle?: string;
  templateIds?: number[];
  projectDescription?: string;
}
