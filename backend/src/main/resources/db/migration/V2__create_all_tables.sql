-- =====================================================================
-- V2: 全新空库自动建表 (Flyway 自管 schema)
--
-- 适用场景: 全新的空 SQL Server 数据库 (baseline-on-migrate=false)。
--   本脚本按 41 个 JPA 实体中的 28 个真实 @Entity 建表, 使 Hibernate
--   ddl-auto=validate 能通过, 后端得以启动。
--
-- ⚠️ 旧库兼容: 面向已有数据/外部维护 schema 的旧库, 不要跑本脚本。
--   旧库请走 Flyway baseline (baseline-on-migrate=true + baseline-version)
--   把现有库标记为已迁移, 从而跳过本建表脚本。
--
-- 命名约定: application.yml 使用 PhysicalNamingStrategyStandardImpl,
--   列名与实体字段/@Column(name) 一字不差 (含大小写与 camelCase)。
--   无 @Column 的字段直接用属性名 (如 title / id / projectId)。
--
-- 类型映射 (对齐 Hibernate 6 / SQL Server, 复刻 .NET 遗留库的 nvarchar):
--   Integer          -> INT
--   Boolean/boolean  -> BIT
--   String(默认)     -> NVARCHAR(255)
--   String(@Column length=N)        -> NVARCHAR(N)
--   String(columnDefinition nvarchar(max) / @Lob) -> NVARCHAR(MAX)
--   LocalDateTime    -> DATETIME2
-- 主键: @GeneratedValue(IDENTITY) -> IDENTITY(1,1); 手动赋值主键不设 IDENTITY。
-- 外键约束: 本脚本刻意不建 FK (validate 不校验 FK), 以规避顺序/跨 schema
--   问题, 仅保证建表与 validate 通过; 外键列本身全部建出。
-- =====================================================================

-- ---------- 1) 幂等创建 schema (dbo 为默认, 无需创建) ----------
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'nbkUser')
    EXEC('CREATE SCHEMA [nbkUser]');

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'Party')
    EXEC('CREATE SCHEMA [Party]');


-- =====================================================================
-- 2) nbkUser schema (23 张表)
-- =====================================================================

-- Users (实体 User)
CREATE TABLE [nbkUser].[Users] (
    [ID]              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [FullName]        NVARCHAR(250) NULL,
    [UserName]        NVARCHAR(50) NULL,
    [Designation]     NVARCHAR(250) NULL,
    [Email]           NVARCHAR(500) NULL,
    [Password]        NVARCHAR(255) NULL,  -- 新库直接建宽以容纳 bcrypt(60 字符);V4 占位迁移仅用于旧库

    [UserTypeID]      INT NULL,
    [Address]         NVARCHAR(MAX) NULL,
    [ContactNo]       NVARCHAR(250) NULL,
    [IsActive]        BIT NULL,
    [Picture]         NVARCHAR(250) NULL,
    [Token]           NVARCHAR(MAX) NULL,
    [TokenValidFrom]  DATETIME2 NULL,
    [TokenValidTo]    DATETIME2 NULL,
    [ContactId]       INT NULL,
    [IsAdmin]         BIT NULL,
    [CompanyID]       INT NULL,
    [IsSystemOwner]   BIT NULL
);

-- ContactBook
-- 遗留库该表 IDENTITY 种子为 (3000,1); 复刻以贴合原行为 (validate 不校验种子)。
CREATE TABLE [nbkUser].[ContactBook] (
    [ID]           INT IDENTITY(3000,1) NOT NULL PRIMARY KEY,
    [OldID]        INT NULL,
    [CityID]       INT NULL,
    [Name]         NVARCHAR(500) NULL,
    [ContactNo]    NVARCHAR(250) NULL,
    [Email]        NVARCHAR(500) NULL,
    [Address]      NVARCHAR(255) NULL,
    [CompanyName]  NVARCHAR(255) NULL,
    [VismaID]      NVARCHAR(200) NULL,
    [ContactName]  NVARCHAR(255) NULL,
    [PartyTypeID]  INT NULL,
    [Comment]      NVARCHAR(255) NULL,
    [IsCompany]    BIT NULL,
    [compName]     NVARCHAR(255) NULL,
    [toBeDeleted]  BIT NULL,
    [PostNo]       NVARCHAR(255) NULL,
    [Poststed]     NVARCHAR(255) NULL,
    [Kommune]      NVARCHAR(255) NULL,
    [TripletexID]  NVARCHAR(200) NULL,
    [Temp_Email]   NVARCHAR(500) NULL,
    [IsAdmin]      BIT NULL,
    [CompanyID]    INT NULL
);

-- Project (主键手动赋值, 不设 IDENTITY)
CREATE TABLE [nbkUser].[Project] (
    [id]                                       INT NOT NULL PRIMARY KEY,
    [VismaID]                                  NVARCHAR(200) NULL,
    [Title]                                    NVARCHAR(MAX) NULL,
    [Dated]                                    DATETIME2 NULL,
    [CustomerID]                               INT NULL,
    [ContactPersonID]                          INT NULL,
    [BuildingSupplierId]                       INT NULL,
    [GardsNo]                                  NVARCHAR(MAX) NULL,
    [Bruksnmmer]                               NVARCHAR(MAX) NULL,
    [Address]                                  NVARCHAR(MAX) NULL,
    [PostNo]                                   NVARCHAR(MAX) NULL,
    [Poststed]                                 NVARCHAR(MAX) NULL,
    [Kommune]                                  NVARCHAR(MAX) NULL,
    [Comments]                                 NVARCHAR(MAX) NULL,
    [InspectorId]                              INT NULL,
    [ProjectLeaderID]                          INT NULL,
    [RemContactCustomerDate]                   DATETIME2 NULL,
    [RemContactCustomerDDL]                    INT NULL,
    [Description]                              NVARCHAR(MAX) NULL,
    [CompleteDate]                             DATETIME2 NULL,
    [isSubmitted]                              BIT NULL,
    [Longitude]                                NVARCHAR(100) NULL,
    [Latitude]                                 NVARCHAR(100) NULL,
    [InspectionEventComment]                   NVARCHAR(MAX) NULL,
    [InspectionDate]                           DATETIME2 NULL,
    [GodkjensDate]                             DATETIME2 NULL,
    [ProjectStatus]                            NVARCHAR(50) NULL,
    [ProjectImage]                             NVARCHAR(200) NULL,
    [InspectorComment]                         NVARCHAR(MAX) NULL,
    [InspectorSignature]                       NVARCHAR(100) NULL,
    [TakkBestillingenCDate]                    DATETIME2 NULL,
    [SoknadOmAnsvarsrettCDate]                 DATETIME2 NULL,
    [AnsvarligSokerCDate]                      DATETIME2 NULL,
    [GratulererGodkjentCDate]                  DATETIME2 NULL,
    [CreateChecklistCDate]                     DATETIME2 NULL,
    [AddPartiesCDate]                          DATETIME2 NULL,
    [SetProLeaderContactCustomerCDate]         DATETIME2 NULL,
    [EmailCustomerUpInspectionCD]              DATETIME2 NULL,
    [UpcomingInspectionCDate]                  DATETIME2 NULL,
    [PartiesDataCDate]                         DATETIME2 NULL,
    [AssignInspectorCDate]                     DATETIME2 NULL,
    [ProjectSubProcessCDate]                   DATETIME2 NULL,
    [ProjectSubCompleteCD]                     DATETIME2 NULL,
    [ReviewInspReportCD]                       DATETIME2 NULL,
    [InvoiceSetCD]                             DATETIME2 NULL,
    [SubmitInspectionRepRemindCD]              DATETIME2 NULL,
    [SubmitInspectionRepRemindAgainCD]         DATETIME2 NULL,
    [KontrollerklaeringPdfCD]                  DATETIME2 NULL,
    [FinalReportPdfCDate]                      DATETIME2 NULL,
    [ModifiedDate]                             DATETIME2 NULL,
    [isDeleted]                                BIT NULL,
    [isArchived]                               BIT NULL,
    [isApprovedInspReport]                     BIT NULL,
    [VismaInvoiceID]                           NVARCHAR(200) NULL,
    [TakkBestillingenIsCompleted]              BIT NULL,
    [SoknadOmAnsvarsrettIsCompleted]           BIT NULL,
    [AnsvarligSokerIsCompleted]                BIT NULL,
    [GratulererGodkjentIsCompleted]            BIT NULL,
    [CreateChecklistIsCompleted]               BIT NULL,
    [AddPartiesIsCompleted]                    BIT NULL,
    [SetProLeaderContactCustomerIsCompleted]   BIT NULL,
    [EmailCustomerUpInspectionIsCompleted]     BIT NULL,
    [PartiesDataIsCompleted]                   BIT NULL,
    [AssignInspectorIsCompleted]               BIT NULL,
    [isApprovedInspReportIsCompleted]          BIT NULL,
    [InvoiceTripletexID]                       NVARCHAR(200) NULL,
    [TepmlateValue]                            NVARCHAR(50) NULL,
    [Avvik]                                    NVARCHAR(MAX) NULL,
    [AvvikSendtKommune]                        NVARCHAR(MAX) NULL,
    [skip_inspection]                          BIT NULL,
    [CompanyID]                                INT NULL,
    [UserID]                                   INT NULL
);

-- ChecklistTemplate
CREATE TABLE [nbkUser].[ChecklistTemplate] (
    [Id]         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Title]      NVARCHAR(255) NULL,
    [isDefault]  BIT NULL,
    [SortOrder]  INT NULL,
    [CompanyID]  INT NULL
);

-- ChecklistItemTemplate
CREATE TABLE [nbkUser].[ChecklistItemTemplate] (
    [Id]           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ChecklistId]  INT NULL,
    [Title]        NVARCHAR(255) NULL,
    [SortOrder]    INT NULL,
    [CompanyID]    INT NULL
);

-- ProjectChecklist
CREATE TABLE [nbkUser].[ProjectChecklist] (
    [id]             INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ProjectId]      INT NULL,
    [SortOrder]      INT NULL,
    [ChecklistName]  NVARCHAR(255) NULL,
    [StartDate]      DATETIME2 NULL,
    [EndDate]        DATETIME2 NULL,
    [Comment]        NVARCHAR(255) NULL
);

-- ChecklistItems (实体 ChecklistItem)
CREATE TABLE [nbkUser].[ChecklistItems] (
    [id]                       INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ChecklistId]              INT NULL,
    [Title]                    NVARCHAR(255) NULL,
    [SortOrder]                INT NULL,
    [Status]                   NVARCHAR(255) NULL,
    [Comment]                  NVARCHAR(255) NULL,
    [FixDate]                  DATETIME2 NULL,
    [wasDev]                   BIT NULL,
    [EmailPartyDate]           DATETIME2 NULL,
    [PartyUploadedImgDate]     DATETIME2 NULL,
    [EmailTempToPartiesIds]    NVARCHAR(255) NULL,
    [isImageUploadedByParty]   BIT NULL
);

-- ChecklistItemImage
CREATE TABLE [nbkUser].[ChecklistItemImage] (
    [ID]               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ChecklistItemID]  INT NULL,
    [ImageName]        NVARCHAR(255) NULL,
    [CaptureDate]      DATETIME2 NULL,
    [ImageSize]        NVARCHAR(255) NULL,
    [ImageType]        NVARCHAR(50) NULL,
    [PartyId]          INT NULL,
    [isOkForFinalPDF]  BIT NULL
);

-- BuildingSupplierTemplate (实体 BuildingSupplier)
CREATE TABLE [nbkUser].[BuildingSupplierTemplate] (
    [id]         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [title]      NVARCHAR(255) NULL,
    [sortOrder]  INT NULL,
    [companyId]  INT NULL
);

-- EmailHistory
CREATE TABLE [nbkUser].[EmailHistory] (
    [ID]              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ProjectID]       INT NULL,
    [PartyId]         INT NULL,
    [Subject]         NVARCHAR(255) NULL,
    [ToEmail]         NVARCHAR(255) NULL,
    [FromEmail]       NVARCHAR(255) NULL,
    [Message]         NVARCHAR(255) NULL,
    [FileName]        NVARCHAR(255) NULL,
    [ProjectStatus]   INT NULL,
    [Status]          BIT NULL,
    [Date]            DATETIME2 NULL,
    [PartyTypeId]     INT NULL,
    [Is_email]        BIT NULL,
    [WorkflowId]      INT NULL,
    [WorkflowStepId]  INT NULL,
    [UrlKey]          NVARCHAR(255) NULL,
    [CompanyID]       INT NULL
);

-- EmailTemplate
CREATE TABLE [nbkUser].[EmailTemplate] (
    [ID]         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Title]      NVARCHAR(500) NULL,
    [Template]   NVARCHAR(MAX) NULL,
    [CompanyID]  INT NULL
);

-- GeneralSetting
CREATE TABLE [nbkUser].[GeneralSetting] (
    [ID]                    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [CompanyName]           NVARCHAR(500) NULL,
    [OrganizationalNumber]  NVARCHAR(250) NULL,
    [Address]               NVARCHAR(MAX) NULL,
    [OwnerName]             NVARCHAR(500) NULL,
    [PostCode]              INT NULL,
    [CityID]                INT NULL,
    [EmailAddress]          NVARCHAR(500) NULL,
    [Telephone]             NVARCHAR(500) NULL,
    [Mobile]                NVARCHAR(500) NULL,
    [EmailSenderName]       NVARCHAR(500) NULL,
    [SenderEmailAddress]    NVARCHAR(500) NULL,
    [IsSystemOwner]         BIT NULL,
    [SignatureImageName]    NVARCHAR(500) NULL,
    [CompEmailHost]         NVARCHAR(200) NULL,
    [CompEmailPort]         NVARCHAR(200) NULL,
    [CompEmailUserName]     NVARCHAR(200) NULL,
    [CompEmailPassword]     NVARCHAR(200) NULL,
    [CompEmailDisplayName]  NVARCHAR(200) NULL,
    [IsActive]              BIT NULL
);

-- InspectionLog
CREATE TABLE [nbkUser].[InspectionLog] (
    [id]         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [projectId]  INT NULL,
    [dateTime]   DATETIME2 NULL
);

-- PostNumber (主键手动赋值, 不设 IDENTITY)
CREATE TABLE [nbkUser].[PostNumber] (
    [Postnummer]      INT NOT NULL PRIMARY KEY,
    [Poststed]        NVARCHAR(100) NULL,
    [Kommunenummer]   INT NULL,
    [Kommunenavn]     NVARCHAR(100) NULL,
    [Kategori]        NVARCHAR(10) NULL
);

-- ProjectParty
CREATE TABLE [nbkUser].[ProjectParty] (
    [ID]           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ProjectID]    INT NULL,
    [PartyID]      INT NULL,
    [PartyTypeID]  INT NULL
);

-- ProjectService
CREATE TABLE [nbkUser].[ProjectService] (
    [Id]          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ProjectId]   INT NULL,
    [ServiceId]   INT NULL,
    [Quantity]    INT NULL,
    [Price]       NVARCHAR(255) NULL,
    [IsNewAdded]  BIT NULL
);

-- ProjectWorkflowSteps
CREATE TABLE [nbkUser].[ProjectWorkflowSteps] (
    [id]                          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [projectId]                   INT NOT NULL,
    [workflowId]                  INT NOT NULL,
    [workflowStepId]              INT NOT NULL,
    [isTransfer]                  BIT NOT NULL,
    [taskId]                      INT NULL,
    [insertDate]                  DATETIME2 NULL,
    [insertedBy]                  INT NULL,
    [serviceWorkflowCategoryId]   INT NULL
);

-- Service
CREATE TABLE [nbkUser].[Service] (
    [Id]                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ServiceTypeId]     INT NULL,
    [Name]              NVARCHAR(255) NULL,
    [Rate]              NVARCHAR(255) NULL,
    [Description]       NVARCHAR(255) NULL,
    [ServiceChargedAs]  INT NULL,
    [ChecklistTempId]   INT NULL,
    [CompanyID]         INT NULL,
    [TripletexId]       NVARCHAR(200) NULL
);

-- ServicePerSlab
CREATE TABLE [nbkUser].[ServicePerSlab] (
    [Id]         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [RangeFrom]  INT NULL,
    [RangeTo]    INT NULL,
    [Rate]       NVARCHAR(50) NULL,
    [ServiceId]  INT NULL
);

-- ServiceType
CREATE TABLE [nbkUser].[ServiceType] (
    [Id]         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name]       NVARCHAR(MAX) NULL,
    [sortOrder]  INT NULL
);

-- ServiceWorkflowCategory
CREATE TABLE [nbkUser].[ServiceWorkflowCategory] (
    [Id]                  INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [WorkflowCategoryID]  INT NULL,
    [ServiceID]           INT NULL
);

-- WorkflowCategory
CREATE TABLE [nbkUser].[WorkflowCategory] (
    [Id]         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name]       NVARCHAR(255) NULL,
    [IsDefault]  BIT NOT NULL
);

-- WorkflowCategorySteps (实体 WorkflowCategoryStep)
CREATE TABLE [nbkUser].[WorkflowCategorySteps] (
    [Id]                  INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [WorkflowCategoryID]  INT NULL,
    [StepName]            NVARCHAR(255) NULL,
    [StepSequence]        INT NULL,
    [IsActive]            BIT NOT NULL,
    [IsTransferable]      BIT NOT NULL
);


-- =====================================================================
-- 3) Party schema (3 张表)
-- =====================================================================

-- Party.PartyType
CREATE TABLE [Party].[PartyType] (
    [ID]                  INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name]                NVARCHAR(500) NULL,
    [SortOrder]           INT NULL,
    [IsDefault]           BIT NOT NULL,
    [WorkflowCategoryID]  INT NULL,
    [CompanyID]           INT NULL
);

-- Party.DocType
CREATE TABLE [Party].[DocType] (
    [ID]           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [PartyTypeID]  INT NULL,
    [DocName]      NVARCHAR(255) NULL,
    [isRequired]   BIT NULL,
    [SortOrder]    INT NULL,
    [CompanyID]    INT NULL
);

-- Party.Doc
CREATE TABLE [Party].[Doc] (
    [ID]              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [PartyID]         INT NULL,
    [PartyTypeID]     INT NULL,
    [PartyDocTypeID]  INT NULL,
    [ProjectID]       INT NULL,
    [OtherDocs]       INT NULL,
    [FileName]        NVARCHAR(255) NULL,
    [Date]            DATETIME2 NULL,
    [isApproved]      BIT NULL,
    [WorkflowId]      INT NULL,
    [WorkflowStepId]  INT NULL,
    [CompanyID]       INT NULL
);


-- =====================================================================
-- 4) dbo schema (2 张表, dbo 默认存在)
-- =====================================================================

-- dbo.DocFolders
CREATE TABLE [dbo].[DocFolders] (
    [Id]          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [CompanyId]   INT NULL,
    [FolderName]  NVARCHAR(255) NULL,
    [FolderPath]  NVARCHAR(255) NULL,
    [CreateDate]  DATETIME2 NULL,
    [IsActive]    BIT NULL
);

-- dbo.S3Bucket
CREATE TABLE [dbo].[S3Bucket] (
    [Id]               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [S3bucketName]     NVARCHAR(255) NULL,
    [S3urlStaticPart]  NVARCHAR(255) NULL,
    [IsActive]         BIT NULL
);
