/**
 * 端点目录 —— 覆盖新后端全部 19 个 controller 的所有 HTTP 端点。
 *
 * 生成规则:
 *  - path:`@RequestMapping` 基路径(去掉 `/api` 前缀)+ 方法级映射,逐字一致。
 *    保留后端的 PascalCase 与旧拼写(Creat / Formated 等),便于与旧前端调用对齐。
 *  - method:由 `@GetMapping/@PostMapping/@PutMapping/@DeleteMapping` 决定。
 *  - auth:
 *      'jwt'    = 带 `@PreAuthorize`(isAuthenticated / hasAuthority 等,需 Bearer token)。
 *      'public' = 无鉴权(登录、健康检查)。
 *      'urlkey' = PartyDoc:外部参与方免登录,靠 UrlKey 访问,controller 无 @PreAuthorize。
 *  - multipart:请求体为 multipart/form-data(含 MultipartFile 参数)时为 true。
 *
 * 注:部分 UserProfile 端点要求 `hasAuthority('ROLE_ADMIN')`,鉴权模式仍归为 'jwt'
 *     (AuthMode 只区分 是否需要 token / urlkey),额外的角色要求见各端点注释。
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type AuthMode = 'jwt' | 'public' | 'urlkey';

export interface EndpointDef {
  readonly method: HttpMethod;
  /** `/api` 之后的路径;Health 例外(见下方注释)。 */
  readonly path: string;
  readonly auth: AuthMode;
  readonly multipart?: boolean;
}

export const endpoints = {
  // AuthController @RequestMapping("/api/users")
  auth: {
    authenticate: { method: 'POST', path: '/users/Authenticate', auth: 'public' },
  },

  // HealthController —— 无 @RequestMapping,映射在根路径下(不在 /api 之下)。
  // 这里的 path 为完整绝对路径,消费方勿再拼 /api 前缀。
  health: {
    root: { method: 'GET', path: '/', auth: 'public' },
    heartbeat: { method: 'GET', path: '/health', auth: 'public' },
  },

  // ContactController @RequestMapping("/api/Contact")
  contact: {
    create: { method: 'POST', path: '/Contact/CreatContact', auth: 'jwt' },
    getAll: { method: 'GET', path: '/Contact/GetAllContact', auth: 'jwt' },
    update: { method: 'PUT', path: '/Contact/UpdateContact', auth: 'jwt' },
    delete: { method: 'DELETE', path: '/Contact/DeleteContact', auth: 'jwt' },
    get: { method: 'GET', path: '/Contact/GetContact', auth: 'jwt' },
  },

  // ServiceController @RequestMapping("/api/Service")
  service: {
    get: { method: 'GET', path: '/Service/GetService', auth: 'jwt' },
    update: { method: 'PUT', path: '/Service/UpdateService', auth: 'jwt' },
    delete: { method: 'DELETE', path: '/Service/DeleteService', auth: 'jwt' },
    create: { method: 'POST', path: '/Service/CreateService', auth: 'jwt' },
    getAll: { method: 'GET', path: '/Service/GetAllService', auth: 'jwt' },
  },

  // PartyTypeController @RequestMapping("/api/PartyType")
  partyType: {
    get: { method: 'GET', path: '/PartyType/GetPartyType', auth: 'jwt' },
    update: { method: 'PUT', path: '/PartyType/UpdatePartyType', auth: 'jwt' },
    delete: { method: 'DELETE', path: '/PartyType/DeletePartyType', auth: 'jwt' },
    create: { method: 'POST', path: '/PartyType/CreatePartyType', auth: 'jwt' },
    getAll: { method: 'GET', path: '/PartyType/GetAllPartyType', auth: 'jwt' },
  },

  // DocTypeController @RequestMapping("/api/DocType")
  docType: {
    get: { method: 'GET', path: '/DocType/GetDocType', auth: 'jwt' },
    update: { method: 'PUT', path: '/DocType/UpdateDocType', auth: 'jwt' },
    delete: { method: 'DELETE', path: '/DocType/DeleteDocType', auth: 'jwt' },
    create: { method: 'POST', path: '/DocType/CreatDocType', auth: 'jwt' },
    getAll: { method: 'GET', path: '/DocType/GetAllDocType', auth: 'jwt' },
  },

  // BuildingSupplierController @RequestMapping("/api/BuildingSupplier")
  buildingSupplier: {
    get: { method: 'GET', path: '/BuildingSupplier/GetBuildingSupplier', auth: 'jwt' },
    update: { method: 'PUT', path: '/BuildingSupplier/UpdateBuildingSupplier', auth: 'jwt' },
    delete: { method: 'DELETE', path: '/BuildingSupplier/DeleteBuildingSupplier', auth: 'jwt' },
    create: { method: 'POST', path: '/BuildingSupplier/CreatBuildingSupplier', auth: 'jwt' },
    getAll: { method: 'GET', path: '/BuildingSupplier/GetAllBuildingSupplier', auth: 'jwt' },
  },

  // MiscellaneousController @RequestMapping("/api/Miscellaneous")
  miscellaneous: {
    getPostCodes: { method: 'GET', path: '/Miscellaneous/GetPostCodes', auth: 'jwt' },
    // 路径变量:/GetPostCodeByNumber/{postNumber}
    getPostCodeByNumber: { method: 'GET', path: '/Miscellaneous/GetPostCodeByNumber', auth: 'jwt' },
  },

  // ChecklistTemplateController @RequestMapping("/api/ChecklistTemplate")
  checklistTemplate: {
    get: { method: 'GET', path: '/ChecklistTemplate/GetChecklistTemplate', auth: 'jwt' },
    update: { method: 'PUT', path: '/ChecklistTemplate/UpdateChecklistTemplate', auth: 'jwt' },
    delete: { method: 'DELETE', path: '/ChecklistTemplate/DeleteChecklistTemplate', auth: 'jwt' },
    createWithItems: { method: 'POST', path: '/ChecklistTemplate/CreatChecklistTemplateWithItems', auth: 'jwt' },
    getAll: { method: 'GET', path: '/ChecklistTemplate/GetAllChecklistTemplate', auth: 'jwt' },
    createItemByTemplateId: { method: 'POST', path: '/ChecklistTemplate/CreatChecklistItemTempByChecklistTempId', auth: 'jwt' },
    updateSingleItem: { method: 'PUT', path: '/ChecklistTemplate/UpdateSingleChecklistItemTemp', auth: 'jwt' },
    deleteSingleItem: { method: 'DELETE', path: '/ChecklistTemplate/DeleteSingleChecklistItemTemp', auth: 'jwt' },
  },

  // EmailTemplateController @RequestMapping("/api/EmailTemplate")
  emailTemplate: {
    get: { method: 'GET', path: '/EmailTemplate/GetEmailTemplate', auth: 'jwt' },
    update: { method: 'PUT', path: '/EmailTemplate/UpdateEmailTemplate', auth: 'jwt' },
    delete: { method: 'DELETE', path: '/EmailTemplate/DeleteEmailTemplate', auth: 'jwt' },
    create: { method: 'POST', path: '/EmailTemplate/CreatEmailTemplate', auth: 'jwt' },
    getAll: { method: 'GET', path: '/EmailTemplate/GetAllEmailTemplate', auth: 'jwt' },
    getAllHashtags: { method: 'GET', path: '/EmailTemplate/GetAllEmailHashtags', auth: 'jwt' },
  },

  // WorkflowCategoryController @RequestMapping("/api/WorkflowCategory")
  workflowCategory: {
    get: { method: 'GET', path: '/WorkflowCategory/GetWorkflowCategory', auth: 'jwt' },
    update: { method: 'PUT', path: '/WorkflowCategory/UpdateWorkflowCategory', auth: 'jwt' },
    delete: { method: 'DELETE', path: '/WorkflowCategory/DeleteWorkflowCategory', auth: 'jwt' },
    create: { method: 'POST', path: '/WorkflowCategory/CreatWorkflowCategory', auth: 'jwt' },
    getAll: { method: 'GET', path: '/WorkflowCategory/GetAllWorkflowCategory', auth: 'jwt' },
    getStepsForOneWorkflow: { method: 'GET', path: '/WorkflowCategory/GetWorkflowCategoryStepsForOneWorkflow', auth: 'jwt' },
    createStep: { method: 'POST', path: '/WorkflowCategory/CreatWorkflowCategoryStep', auth: 'jwt' },
    getSingleStep: { method: 'GET', path: '/WorkflowCategory/GetSingleWorkflowCategoryStep', auth: 'jwt' },
    updateSingleStep: { method: 'PUT', path: '/WorkflowCategory/UpdateSingleWorkflowCategoryStep', auth: 'jwt' },
    deleteStep: { method: 'DELETE', path: '/WorkflowCategory/DeleteWorkflowCategoryStep', auth: 'jwt' },
  },

  // CompanyController @RequestMapping("/api/Company")
  company: {
    getProfile: { method: 'GET', path: '/Company/GetProfile', auth: 'jwt' },
    updateProfile: { method: 'PUT', path: '/Company/UpdateProfile', auth: 'jwt' },
    addNewProfile: { method: 'PUT', path: '/Company/AddNewCompanyProfile', auth: 'jwt' },
    getAllProfiles: { method: 'GET', path: '/Company/GetAllProfiles', auth: 'jwt' },
    checkSystemOwnerStatus: { method: 'GET', path: '/Company/CheckForSystemOwnerStatus', auth: 'jwt' },
    getBucketDetail: { method: 'GET', path: '/Company/GetBucketDetail', auth: 'jwt' },
    updateS3Bucket: { method: 'PUT', path: '/Company/UpdateS3Bucket', auth: 'jwt' },
    getAllFolders: { method: 'GET', path: '/Company/GetAllCompaniesFolders', auth: 'jwt' },
    getSingleFolder: { method: 'GET', path: '/Company/GetSingleCompanyFolder', auth: 'jwt' },
    updateSingleFolder: { method: 'PUT', path: '/Company/UpdateSingleCompanyFolder', auth: 'jwt' },
    addFolder: { method: 'PUT', path: '/Company/AddCompanyFolder', auth: 'jwt' },
  },

  // UserProfileController @RequestMapping("/api/UserProfile")
  userProfile: {
    get: { method: 'GET', path: '/UserProfile/GetUserProfile', auth: 'jwt' },
    update: { method: 'PUT', path: '/UserProfile/UpdateUserProfile', auth: 'jwt' },
    // 以下 3 个要求 ROLE_ADMIN(hasAuthority('ROLE_ADMIN'))
    create: { method: 'POST', path: '/UserProfile/CreateUserProfile', auth: 'jwt' },
    delete: { method: 'DELETE', path: '/UserProfile/DeleteUserProfile', auth: 'jwt' },
    getAll: { method: 'GET', path: '/UserProfile/GetAllUserProfile', auth: 'jwt' },
  },

  // ProjectController @RequestMapping("/api/Project")
  project: {
    getCount: { method: 'GET', path: '/Project/GetProjectsCount', auth: 'jwt' },
    getAllList: { method: 'GET', path: '/Project/GetAllProjectList', auth: 'jwt' },
    getAllListNotArchivedOrDeleted: { method: 'GET', path: '/Project/GetAllProjectListNotArchivedOrDeleted', auth: 'jwt' },
    getAllArchivedList: { method: 'GET', path: '/Project/GetAllArchivedProjectList', auth: 'jwt' },
    getAllDeletedList: { method: 'GET', path: '/Project/GetAllDeletedProjectList', auth: 'jwt' },
    get: { method: 'GET', path: '/Project/GetProject', auth: 'jwt' },
    update: { method: 'PUT', path: '/Project/UpdateProject', auth: 'jwt' },
    delete: { method: 'DELETE', path: '/Project/DeleteProject', auth: 'jwt' },
    create: { method: 'POST', path: '/Project/CreatProject', auth: 'jwt' },
    archive: { method: 'GET', path: '/Project/ArchiveProject', auth: 'jwt' },
    getAllChecklists: { method: 'GET', path: '/Project/GetAllProjectChecklists', auth: 'jwt' },
    getSingleChecklist: { method: 'GET', path: '/Project/GetSingleProjectChecklist', auth: 'jwt' },
    createSingleChecklist: { method: 'POST', path: '/Project/CreateSingleProjectChecklist', auth: 'jwt' },
    updateSingleChecklist: { method: 'POST', path: '/Project/UpdateSingleProjectChecklist', auth: 'jwt' },
    deleteSingleChecklist: { method: 'DELETE', path: '/Project/DeleteSingleProjectChecklist', auth: 'jwt' },
    createSingleChecklistItem: { method: 'POST', path: '/Project/CreatSingleProjectChecklistItem', auth: 'jwt' },
    updateSingleChecklistItem: { method: 'PUT', path: '/Project/UpdateSingleProjectChecklistItem', auth: 'jwt' },
    deleteSingleChecklistItem: { method: 'DELETE', path: '/Project/DeleteSingleProjectChecklistItem', auth: 'jwt' },
    deleteService: { method: 'DELETE', path: '/Project/DeleteProjectService', auth: 'jwt' },
    getAllPartiesByProjectId: { method: 'GET', path: '/Project/GetAllProjectPartiesByProjectID', auth: 'jwt' },
    associatePartyWithProjectPartyType: { method: 'POST', path: '/Project/AssociatePartyWithProjectPartyType', auth: 'jwt' },
    getContactCustomerReminderDate: { method: 'GET', path: '/Project/GetProjectContactCustomerReminderDate', auth: 'jwt' },
    associateProjectLeader: { method: 'POST', path: '/Project/AssociateProjectLeaderWithProject', auth: 'jwt' },
    getProjectLeaderByProjectId: { method: 'GET', path: '/Project/GetProjectLeaderWithProjectID', auth: 'jwt' },
    getInspectorUsers: { method: 'GET', path: '/Project/GetInspectorUsers', auth: 'jwt' },
    getWFTenSavedDetails: { method: 'GET', path: '/Project/GetProjectWFTenSavedDetails', auth: 'jwt' },
    getAllChecklistsInspData: { method: 'GET', path: '/Project/GetAllProjectChecklistsInspData', auth: 'jwt' },
    updateSingleChecklistItemInspData: { method: 'PUT', path: '/Project/UpdateSingleProjectChecklistItemInspData', auth: 'jwt' },
    deleteSingleChecklistItemImageInspData: { method: 'DELETE', path: '/Project/DeleteSingleProjectChecklistItemImageInspData', auth: 'jwt' },
  },

  // ProjectDocController @RequestMapping("/api/Project")(与 Project 同基路径)
  projectDoc: {
    getInspThirdPartyEmailFormated: { method: 'POST', path: '/Project/GetProjectInspThirPartyEmailFormated', auth: 'jwt' },
    inspThirdPartySendEmail: { method: 'POST', path: '/Project/ProjectInspThirPartySendEmail', auth: 'jwt', multipart: true },
    requiredDocListAllParties: { method: 'GET', path: '/Project/ProjectRequiredDocListAllParties', auth: 'jwt' },
    requiredDocListBySingleParty: { method: 'GET', path: '/Project/ProjectRequiredDocListBySingleParty', auth: 'jwt' },
    approvalRequiredDocList: { method: 'GET', path: '/Project/ProjectApprovalRequiredDocList', auth: 'jwt' },
    uploadDocument: { method: 'POST', path: '/Project/ProjectUploadDocument', auth: 'jwt', multipart: true },
    systemGeneratedDocListAllSteps: { method: 'GET', path: '/Project/ProjectSystemGeneratedDocListAllSteps', auth: 'jwt' },
    otherDocList: { method: 'GET', path: '/Project/ProjectOtherDocList', auth: 'jwt' },
    deleteDocument: { method: 'DELETE', path: '/Project/DeleteProjectDocument', auth: 'jwt' },
  },

  // ProjectWorkflowController @RequestMapping("/api/ProjectWorkflow")
  // 15 步工作流:每步含 GetXxxEmailFormated(取邮件预览)+ 执行/发送/转移端点。
  projectWorkflow: {
    getWorkflowStep: { method: 'GET', path: '/ProjectWorkflow/GetProjectWorkflowStep', auth: 'jwt' },
    getCompletedTransferedSteps: { method: 'GET', path: '/ProjectWorkflow/GetProjectWorkflowCompletedTransferedSteps', auth: 'jwt' },
    // Step 1
    getWFOneEmailFormated: { method: 'POST', path: '/ProjectWorkflow/GetProjectWFOneEmailFormated', auth: 'jwt' },
    wfOne: { method: 'POST', path: '/ProjectWorkflow/ProjectWFOne', auth: 'jwt' },
    // Step 2
    getWFTwoEmailFormated: { method: 'POST', path: '/ProjectWorkflow/GetProjectWFTwoEmailFormated', auth: 'jwt' },
    wfTwo: { method: 'POST', path: '/ProjectWorkflow/ProjectWFTwo', auth: 'jwt', multipart: true },
    // Step 3
    wfThree: { method: 'POST', path: '/ProjectWorkflow/ProjectWFThree', auth: 'jwt', multipart: true },
    getWFThree: { method: 'POST', path: '/ProjectWorkflow/GetProjectWFThree', auth: 'jwt' },
    // Step 4
    getWFFourEmailFormated: { method: 'POST', path: '/ProjectWorkflow/GetProjectWFFourEmailFormated', auth: 'jwt' },
    wfFour: { method: 'POST', path: '/ProjectWorkflow/ProjectWFFour', auth: 'jwt' },
    // Step 5
    wfFive: { method: 'POST', path: '/ProjectWorkflow/ProjectWFFive', auth: 'jwt' },
    // Step 6
    wfSix: { method: 'POST', path: '/ProjectWorkflow/ProjectWFSix', auth: 'jwt' },
    // Step 7
    wfSeven: { method: 'POST', path: '/ProjectWorkflow/ProjectWFSeven', auth: 'jwt' },
    // Step 8
    getWFEightEmailFormated: { method: 'POST', path: '/ProjectWorkflow/GetProjectWFEightEmailFormated', auth: 'jwt' },
    wfEightTransfer: { method: 'POST', path: '/ProjectWorkflow/ProjectWFEightTransfer', auth: 'jwt' },
    wfEightSendEmail: { method: 'POST', path: '/ProjectWorkflow/ProjectWFEightSendEmail', auth: 'jwt' },
    // Step 9
    getWFNineEmailFormated: { method: 'POST', path: '/ProjectWorkflow/GetProjectWFNineEmailFormated', auth: 'jwt' },
    wfNineTransfer: { method: 'POST', path: '/ProjectWorkflow/ProjectWFNineTransfer', auth: 'jwt' },
    wfNineSendEmail: { method: 'POST', path: '/ProjectWorkflow/ProjectWFNineSendEmail', auth: 'jwt' },
    // Step 10
    wfTenTransfer: { method: 'POST', path: '/ProjectWorkflow/ProjectWFTenTransfer', auth: 'jwt' },
    wfTen: { method: 'POST', path: '/ProjectWorkflow/ProjectWFTen', auth: 'jwt' },
    // Step 11
    wfElevenDone: { method: 'POST', path: '/ProjectWorkflow/ProjectWFElevenDone', auth: 'jwt' },
    // Step 12
    getWFTwelveEmailFormated: { method: 'POST', path: '/ProjectWorkflow/GetProjectWFTwelveEmailFormated', auth: 'jwt' },
    wfTwelve: { method: 'POST', path: '/ProjectWorkflow/ProjectWFTwelve', auth: 'jwt' },
    // Step 13
    getWFThirteenEmailFormated: { method: 'POST', path: '/ProjectWorkflow/GetProjectWFThirteenEmailFormated', auth: 'jwt' },
    wfThirteen: { method: 'POST', path: '/ProjectWorkflow/ProjectWFThirteen', auth: 'jwt', multipart: true },
    // Step 14
    getWFFourteenEmailFormated: { method: 'POST', path: '/ProjectWorkflow/GetProjectWFFourteenEmailFormated', auth: 'jwt' },
    wfFourteen: { method: 'POST', path: '/ProjectWorkflow/ProjectWFFourteen', auth: 'jwt', multipart: true },
    // Step 15
    wfFifteenGetDetails: { method: 'POST', path: '/ProjectWorkflow/ProjectWFFifteenGetDetails', auth: 'jwt' },
    wfFifteen: { method: 'POST', path: '/ProjectWorkflow/ProjectWFFifteen', auth: 'jwt' },
    // Step 2 - Step One 子步骤
    updateWFTwoStepOne: { method: 'PUT', path: '/ProjectWorkflow/UpdateProjectWFTwoStepOne', auth: 'jwt' },
    getWFTwoStepOne: { method: 'POST', path: '/ProjectWorkflow/GetProjectWFTwoStepOne', auth: 'jwt' },
  },

  // MobileAppController @RequestMapping("/api/MobileApp")
  mobileApp: {
    getProjectList: { method: 'GET', path: '/MobileApp/GetProjectList', auth: 'jwt' },
    projectDetail: { method: 'GET', path: '/MobileApp/ProjectDetail', auth: 'jwt' },
    projectUpdate: { method: 'POST', path: '/MobileApp/ProjectUpdate', auth: 'jwt', multipart: true },
    projectSubmit: { method: 'POST', path: '/MobileApp/ProjectSubmit', auth: 'jwt' },
    checklistItems: { method: 'GET', path: '/MobileApp/ChecklistItems', auth: 'jwt' },
    checklistUpdate: { method: 'POST', path: '/MobileApp/ChecklistUpdate', auth: 'jwt', multipart: true },
    log: { method: 'GET', path: '/MobileApp/Log', auth: 'jwt' },
    getChecklistTemplates: { method: 'GET', path: '/MobileApp/GetChecklistTemplates', auth: 'jwt' },
    createChecklistFromTemplate: { method: 'POST', path: '/MobileApp/CreateChecklistFromTemplate', auth: 'jwt' },
  },

  // PartyDocController @RequestMapping("/api/PartyDoc") —— 外部参与方免登录(UrlKey)
  partyDoc: {
    getDocumentsListRequiredFromParty: { method: 'GET', path: '/PartyDoc/GetDocumentsListRequiredFromParty', auth: 'urlkey' },
    uploadDocumentFromParty: { method: 'POST', path: '/PartyDoc/UploadDocumentFromParty', auth: 'urlkey', multipart: true },
    getDocumentsListCountUploadByParty: { method: 'GET', path: '/PartyDoc/GetDocumentsListCountUploadByParty', auth: 'urlkey' },
    getProjectSinglePartyDocsUploadedFileList: { method: 'GET', path: '/PartyDoc/GetProjectSinglePartyDocsUploadedFileList', auth: 'urlkey' },
    getChecklistItemInspectinDataForParty: { method: 'GET', path: '/PartyDoc/GetChecklistItemInspectinDataForParty', auth: 'urlkey' },
    uploadChecklistItemImageInspectinDataFromParty: { method: 'POST', path: '/PartyDoc/UploadChecklistItemImageInspectinDataFromParty', auth: 'urlkey', multipart: true },
  },

  // ConvertHtmlToPdfController @RequestMapping("/api/ConvertHtmlToPdf")
  convertHtmlToPdf: {
    convertToPdf: { method: 'POST', path: '/ConvertHtmlToPdf/ConvertToPdf', auth: 'jwt' },
  },
} as const satisfies Record<string, Record<string, EndpointDef>>;
