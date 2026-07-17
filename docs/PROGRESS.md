# NKS v2 重写进度

对照 `ARCHITECTURE.md` 的路线图。✅=完成并编译通过 / 🔄=进行中 / ⬜=未开始

## Phase 0 — 骨架 ✅
- monorepo(pnpm+Turborepo)、ARCHITECTURE.md、.gitignore、根配置

## Phase 1 — 后端地基 ✅(JDK 21 编译通过)
- pom(Spring Boot 3.4.5 / Java 21)、application.yml + .env.example(密钥全外置)
- Security(JWT jjwt 0.12、bcrypt、DES→bcrypt 平滑迁移、CORS 白名单、fail-fast 密钥)
- 大小写不敏感参数过滤器、全局异常、Health
- Flyway 基线(V1 空基线、V2 索引、V3 密码列加宽待启用)

## Phase 2 — 主数据 CRUD ✅(13 controller 编译通过)
- Auth、Contact(黄金样板)、Service、PartyType、DocType(桩鉴权漏洞已修)、
  BuildingSupplier、Miscellaneous、ChecklistTemplate、EmailTemplate、
  WorkflowCategory、Company(+超级管理面板/S3桶/文件夹)、UserProfile
- 契约稳定:PascalCase 端点/字段、JSON 包装键与旧版一字不差

### Phase 2 遗留待清理(技术债,契约不变前提下)
- [ ] `ServiceServiceImpl` 的 `setDataCompany` 有状态字段(单例可变,多线程隐患)→ 改为 companyId 作方法参数
- [ ] `ProjectPartyRepository` 两个 `@Query` 临时降级为 `Object[]`(等 Phase 3 移植 `ProjectPartyDetailsDto` 后恢复 DTO 投影)
- [ ] DocType/GeneralSetting update 的 `sortOrder`/`cityID`/`isSystemOwner` null 覆盖(旧行为,视需要保留或修)
- [ ] WorkflowCategory 日志 `user.getUsername()` 潜在 NPE(旧行为)

## Phase 3 — 后端核心 ✅(全量编译通过:321 源文件 / 19 controller / 393 classes)
- 基础设施层:S3(**SDK v2** + IAM Role 优先 + SSE)、Email(每公司 SMTP + hashtag + 附件/ICS,异步)、HTML→PDF(iText)+ OpenPDF AcroForm、ICS(ical4j)、Tripletex(session token **TTL 缓存自动刷新**、硬编码常量入配置、补齐 invoice)、Caffeine 缓存现代化、三线程池 AsyncConfig
- Project 全生命周期(ProjectController 26 端点:列表/CRUD/归档软删/清单/参与方/负责人/检验员/InspData)
- ProjectWorkflow 15 步引擎(忠实复刻;状态机化重构留待后续)
- ProjectDoc(8)、PartyDoc(6,UrlKey 免登录,SecurityConfig 已放行 /api/PartyDoc/**)、MobileApp(9)、ConvertHtmlToPdf

### 后端整体收尾清单(功能已全,契约稳定;以下为可选优化/需真实环境验证)
- [ ] Tripletex getInvoiceDetails/sendInvoice 标了 TODO,需对接真实 Tripletex 环境集成测试(order→invoice 两段式待确认)
- [ ] Service `setDataCompany` 有状态字段 → 改无状态(companyId 作参数)
- [ ] S3 `uploadFileAsync` 每次新建线程池 → 复用共享池
- [ ] EmailHistory.companyId 硬编码 1(旧 TODO)→ 用真实 companyId
- [ ] WorkflowCategory 日志 user.getUsername() 潜在 NPE
- [ ] 端到端运行验证需:RDS SQL Server 凭证 + AWS S3 + SMTP + Tripletex(本机无法跑)
- [ ] V3 密码列加宽迁移待连线上 DB 核实可空性后启用

## Phase 4 — Admin(Next.js 16 + React 19 + shadcn)✅(typecheck + build EXIT=0,19 路由)
- ✅ 地基:Next 16 + Tailwind v4 + shadcn + TanStack Query v5 + rhf/zod;登录认证纵切(cookie + middleware 守卫 + useSyncExternalStore)、仪表盘壳 + 挪威语侧栏导航
- ✅ 共享 CRUD 原语:DataTable、useApiMutation、表单弹窗模式、shadcn ui
- ✅ 主数据 7 模块:Contact、Service(阶梯价子表单)、PartyType、DocType、BuildingSupplier、EmailTemplate(Tiptap v3 + hashtag 插入 + 预览)、WorkflowCategory(+步骤)、ChecklistTemplate(模板+子项两层)
- ✅ Project:列表三态(active/archived/deleted 子路由)+ 新建向导(ProjectInfo/CustomerInfo/Pricing)+ 工作台五 Tab 壳
- ✅ 16 步工作流 UI:数据驱动步骤注册表 + 6 通用面板(email/upload/date-inspector/invoice/pdf/simple)+ 竖向 Stepper,覆盖 WF1–15 全部执行入口 + multipart/ICS/发票/PDF
- ✅ Team(用户 CRUD / 个人 / 公司资料+SMTP 三 Tab)、超级管理面板(多公司,SystemOwner 门禁)、外部无登录页(UploadDocument/UpdateDeviation,PartyDoc UrlKey)

### Phase 4 待真实环境验证/优化(功能已全)
- [ ] 工作流请求体用 camelCase(后端 Jackson 大小写不敏感,需连真实后端验一次;serviceWorkflowCategoryId 附值待确认)
- [ ] archive/delete mutation errorMessage:false 静默失败 → 补 toast
- [ ] ChecklistTemplate 列表"子项数"依赖 GetAll 是否返回子项;编辑模板不下发子项(靠独立端点管理)
- [ ] dto/api 移动端读模型字段大小写(见契约包待验证项)——影响 Mobile
## Phase 5 — Mobile(统一 Expo SDK 57)✅(typecheck EXIT=0,expo-doctor 20/20)
- ✅ 地基:Expo SDK 57 + expo-router + React 19 + NativeWind v4 + RTK/redux-persist + TanStack Query + api-client;Metro pnpm-workspace 配置;SecureStore token + 续登(GetUserProfile)+ 401 自动登出
- ✅ 登录 + 项目列表(GetProjectList)
- ✅ 离线优先数据层:activeProject slice + persist、NetInfo 在线判定、`updated`/`projectDirty` 去重、恢复联网补传(resyncPending);ProjectUpdate/ChecklistUpdate multipart 表单构造(PascalCase 照旧客户端)
- ✅ Info(改期/地址导航/拨号/描述)、Exterior 外景拍照(ProjectUpdate multipart)
- ✅ 清单目录 + **单清单填写**(三态 OK/Avvik/IA + 强制拍照 + IA 清图 + 九宫格删图 + 离线同步角标)
- ✅ Plantegning PDF 户型图(react-native-pdf:翻页/旋转/缩放,需 dev build)
- ✅ Submit + **必填签名**(react-native-signature-canvas)+ 补传未同步项 + ProjectSubmit + 清缓存;Log 上次提交时间;Stepper gating(外景/清单 100%/签名 三门禁)
- 合并结论:两个旧移动端合为一个 Expo app,web 版完整功能(PDF/签名提交/离线)全部补齐到原生

### Phase 5 运行验证需(本机无法 headless 跑)
- [ ] 需 EAS / expo prebuild dev build(react-native-pdf 依赖原生模块,不支持 Expo Go)+ 真机 + 后端凭证
- [ ] 移动端写侧 PascalCase 请求体 / ChecklistItems 参数 / 图片字段大小写:连真实后端跑通一次确认(后端 Jackson 对入参大小写不敏感,理论 OK)
## Phase 6 — AWS 部署 ✅(后端 + Admin 已上线并验证,eu-north-1)
- 单台 EC2 + Docker Compose(账号 246710929963,`Project=nks-v2` 标签隔离);详见 `DEPLOYMENT.md`
- Admin http://16.170.55.219(未登录跳 /login,验证通过);后端 API http://16.170.55.219:8080(/health=OK,登录返回规范 401)
- 全新库 Flyway 自动建表(28 表)成功;资源:S3 nks-files-*、SG、EIP、EC2 t3.large、3 容器(mssql/backend/admin)
- 待办:①空库需 seed 初始 admin 用户才能登录 ②S3 运行时凭证(部署用户无 IAM 建权)③HTTPS/域名 ④SMTP/Tripletex 凭证 ⑤移动端未部署(用户要求跳过)

## 共享契约包 ✅(tsc EXIT=0)
- `packages/api-types`:common(ApiError/RequestResponse/映射规则)+ 17 个 model 文件(**146 个接口**,对齐后端 DTO 线上形状,PascalCase/@JsonProperty/@JsonIgnore 已处理)+ `endpoints.ts`(**157 端点**目录:method/path/auth/multipart,按 19 controller 分组)
- `packages/api-client`:框架无关传输层(`/api` 前缀、Bearer、multipart、401 回调、NksApiError)
- pnpm workspace + Turborepo 已 install
- 待 Phase 5 核对:`dto/api` 移动端读模型字段线上大小写(按 Jackson getter 派生为 camelCase,需与旧移动端实际读取字段交叉验证)
