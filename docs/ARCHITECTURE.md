# NKS v2 架构与重写路线图

> Norsk ByggeKontroll(NKS)—— 挪威独立建筑检验(uavhengig kontroll)多租户 SaaS。
> 本文件是"零功能遗漏"的对照契约与分阶段计划,重写全程以此核对。旧四库(`../nbk`、`../nksystem-frontend-main`、`../kontrollApp`、`../nks-kontroll-app-master`)保留作参照。

## 1. 技术决策(已拍板 2026-07-14)

| 层 | 选型 | 说明 |
|---|---|---|
| 后端 | **Spring Boot 3.4+ / Java 21** | 保留 Java,修全部技术债 |
| 数据库 | **AWS RDS SQL Server** | 零迁移,复用现 schema |
| 管理后台 | **Next.js 15(App Router)+ React 19 + shadcn/ui + Tailwind** | + TanStack Query/Table + react-hook-form + zod |
| 移动端 | **统一 Expo(SDK 53+)+ expo-router + RTK + TanStack Query** | 两个旧移动端合并为一个 |
| API 契约 | **保持稳定** | 路径/字段不变,可随时对照旧系统验证 |
| Monorepo | **pnpm + Turborepo** | `backend` 为独立 Maven 模块 |

**通用原则**:所有库必须主流、社区活跃维护。后端将来部署 AWS。

## 2. 仓库结构

```
nks-v2/
├── backend/                 # Spring Boot 3.4 / Java 21(Maven,独立)
├── apps/
│   ├── admin/               # Next.js 15 管理后台 (@nks/admin)
│   └── mobile/              # Expo 统一移动端 (@nks/mobile)
├── packages/
│   ├── api-types/           # 共享 TS 领域类型 + 端点契约 (@nks/api-types)
│   └── api-client/          # 共享 typed API client (@nks/api-client)
└── docs/
```

## 3. 现代化改造清单(后端技术债 → 目标)

1. DES 密码(硬编码密钥)→ **bcrypt**(首登重哈希迁移,双读兼容期)
2. 凭证明文在 application.properties → **环境变量 / AWS Secrets Manager**,全部轮换
3. `AuthorizeServiceImpl` 桩鉴权(写死 companyId=1)→ 删除,统一 Spring Security
4. CORS 全开 + 两处重复 → 按 `frontend.url` 白名单收敛
5. JWT 无 refresh、DB token 与 JWT 双轨 → **access + refresh token**,清除密钥回退逻辑
6. 15 步硬编码方法 + Project 几十列状态散落 → 抽象**工作流状态机**(step 定义驱动),Project 瘦身(状态入 ProjectWorkflowSteps)
7. AWS SDK v1 → **v2 + IAM Role**(去静态 AK/SK)
8. Tripletex sessionToken 实例字段 → **带 TTL 缓存 + 自动刷新**;补齐 MOCK 的 getInvoiceDetails/sendInvoice
9. 内存 loggedInUsers → 查库 / 审计表
10. 声明 Caffeine 实用 ConcurrentMap → **真用 Caffeine**(多实例可评估 Redis)
11. ddl-auto=validate + 手工 SQL → **Flyway**(引入迁移基线)
12. multipart 塞 JSON 手动解析 → 保留兼容(契约稳定),内部封装工具类
13. 无定时任务 → reminder 用 **Spring Scheduling / EventBridge**(部署期)
14. 移除生产 `/api/test/*`(无鉴权)与 `/dbtest/users`
15. 三处有状态设计(本地缓存/Tripletex 实例态/内存用户)全部消除 → 可水平扩展

## 4. 分阶段路线图

- **Phase 0 ✅ 进行中**:monorepo 骨架、架构文档、共享 api-types/api-client 契约包
- **Phase 1 后端地基**:Spring Boot 3.4/Java21 工程、配置外置、Security(JWT+bcrypt+refresh)、JPA 实体(40 表)、Flyway 基线、S3 v2、全局异常/CORS
- **Phase 2 后端业务**:主数据 CRUD(Contact/Service/PartyType/DocType/BuildingSupplier/ChecklistTemplate/EmailTemplate/Company/UserProfile)+ Miscellaneous
- **Phase 3 后端核心**:Project 全生命周期、工作流引擎(15步,状态机化)、ProjectDoc、PartyDoc(UrlKey 免登录)、邮件(每公司 SMTP + hashtag)、HTML→PDF、ICS、Tripletex 开票、MobileApp 接口
- **Phase 4 Admin**:Next.js 骨架 + 认证 + 布局导航;项目列表/向导/工作台/16步工作流 UI;主数据 CRUD;团队;外部无登录页;超级管理面板
- **Phase 5 Mobile**:Expo 骨架 + 认证;项目列表/信息/外景;单清单填写(三态+强制拍照+离线优先);PDF 户型图;Submit+签名;Log;Stepper 引导
- **Phase 6 部署**:AWS(RDS + ECS/App Runner 后端、Amplify/S3+CloudFront admin、EAS mobile)、Secrets、CI

## 5. 功能对照清单(零遗漏基线)

### 后端接口(基址 /api)—— 见 `packages/api-types/src/endpoints.ts`
AuthController · UserProfile · Company(含超级管理面板/S3桶/文件夹)· Contact · BuildingSupplier · PartyType · DocType · Service · ChecklistTemplate(+Item)· WorkflowCategory(+Step)· EmailTemplate(+Hashtags)· Miscellaneous(邮编)· Project(核心:列表/CRUD/归档软删/清单/参与方/负责人/检验员/InspData)· ProjectDoc · ProjectWorkflow(WFOne..WFFifteen)· MobileApp(9接口)· PartyDoc(UrlKey 6接口)· ConvertHtmlToPdf

### 数据模型(40 实体,CompanyID 租户键)
User · GeneralSetting/CompanyProfile · ContactBook · Project · ProjectParty · PartyType · ProjectService · Service · ServiceType · ServicePerSlab · ServiceWorkflowCategory · ChecklistTemplate · ChecklistItemTemplate · ProjectChecklist · ChecklistItem · ChecklistItemImage · WorkflowCategory · WorkflowCategoryStep · ProjectWorkflowSteps · Doc · DocType · DocFolders · S3Bucket · EmailTemplate · EmailHistory · BuildingSupplier · InspectionLog · PostNumber

### Admin 业务模块
项目(列表/归档/删除/向导ProjectInfo+CustomerInfo+PricingTab/工作台/16步工作流+Done视图+Transfer)· 联系人 · 服务 · 清单模板 · 第三方类型 · 建材供应商 · 文档类型 · 邮件模板(WYSIWYG+hashtag)· 团队(公司/个人/用户)· 外部无登录(UploadDocument/UpdateDeviation)· 超级管理面板(多公司)· 登录

### Mobile 功能(合并后必须全有)
登录+token续登+401登出 · 项目列表 · 项目信息(改检验日期/地址导航/拨号/描述)· 外景拍照 · 清单目录 · **单清单填写**(三态OK/Avvik/IA + 强制拍照多张 + IA清图 + 备注 + 九宫格删图 + 离线优先updated去重)· **PDF户型图**(翻页/旋转/缩放)· **Submit**(复核+总评+必填签名+补传+ProjectSubmit+清缓存)· 提交日志Log · Stepper强制引导 · 手势滑动
