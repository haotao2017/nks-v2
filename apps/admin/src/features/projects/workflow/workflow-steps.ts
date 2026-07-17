/**
 * WORKFLOW_STEPS —— 项目工作流(Workflow 1)的「数据驱动步骤注册表」。
 *
 * 设计:后端有 15 个执行步骤(ProjectWFOne..ProjectWFFifteen),UI 展示为旧 admin 的 16 步。
 * 每步声明 { seq, key, title(挪威语), type, workflowId, workflowStepId, endpoints, flags }。
 * project-workflow.tsx 的竖向 stepper 遍历本数组,按 type 选一个通用面板组件渲染,
 * 避免为 16 个几乎重复的步骤各写一个组件。
 *
 * workflowStepId 的取值来自旧 admin 各步组件里「硬编码」的后端步骤号(与 UI 序号有偏移):
 *  - S1..S3 与后端 1:1;S5 起因为旧 UI 无 S4,后端号 = UI 号 - 1;
 *  - 末尾三步(faktura/kontrollerklæring/sluttrapport/utført)顺序被打乱:
 *    S13→后端15(发票)、S14→后端13、S15→后端14、S16→后端14(仅 stepId=18 区分)。
 *
 * 请求体统一用 camelCase(对齐 @nks/api-types 的 ProjectWorkflowDto 字段名 = 后端 Java 字段名),
 * 外层包装键为 PascalCase `ProjectWorkflow`(后端 @JsonProperty)。见 workflow-api.ts。
 */
import { endpoints } from '@nks/api-types/endpoints';

/** 步骤面板类型 —— 决定用哪个通用面板组件渲染。 */
export type WorkflowStepType =
  | 'email' // 取格式化邮件预览 → 富文本编辑正文/主题/收件人 → 执行/发送
  | 'upload' // multipart 文件上传(+ 可选邮件预览)
  | 'date-inspector' // 定检验日期 + 指派检验员(WF10)
  | 'invoice' // 触发 Tripletex 发票(WF15)
  | 'pdf' // 生成/预览 PDF 报告 + 邮件发送(WF13/14,multipart)
  | 'simple'; // 确认执行(可选日期字段)

/** 端点描述符(来自 endpoints.projectWorkflow.* / endpoints.project.*)。 */
export interface EndpointDescriptor {
  method: string;
  path: string;
  auth?: string;
  multipart?: boolean;
}

export interface WorkflowStepDef {
  /** UI 展示序号(1..16)。 */
  seq: number;
  /** 稳定 key(用于选中态与 React key)。 */
  key: string;
  /** 挪威语标题。 */
  title: string;
  /** 简短说明(挪威语)。 */
  description?: string;
  type: WorkflowStepType;
  /** 工作流 ID(Workflow 1)。 */
  workflowId: number;
  /** 后端步骤 ID(硬编码,见文件头注释)。 */
  workflowStepId: number;

  /** 取邮件/详情预览端点(email/upload/pdf/invoice)。 */
  preview?: EndpointDescriptor;
  /** 执行端点(email 的 wfXxx / upload / pdf / invoice / simple)。 */
  execute?: EndpointDescriptor;
  /** 推进(Transfer)端点 —— 标记完成/跳过而不发信(WF8/9/10)。 */
  transfer?: EndpointDescriptor;
  /** 发信端点 —— 与 Transfer 分离(WF8/9)。 */
  sendEmail?: EndpointDescriptor;

  // ── flags ──
  /** multipart 上传时文件字段名为 `files`(数组)而非 `file`(单个)。仅 S3。 */
  multiFile?: boolean;
  /** simple 步骤附带一个日期字段(contactCustomerDate)。仅 S8 påminnelse。 */
  dateField?: boolean;
  /** email 步骤为「多收件人/按参与方」模式(emailProjectParties)。仅 S10。 */
  multiRecipient?: boolean;
  /** simple 步骤执行时置 isApprovedInspReport=true。仅 S12 gjennomgå rapport。 */
  approve?: boolean;
}

const pw = endpoints.projectWorkflow;

export const WORKFLOW_ID = 1;

/** Workflow 1 的 16 步注册表。 */
export const WORKFLOW_STEPS: WorkflowStepDef[] = [
  {
    seq: 1,
    key: 'takk-for-bestillingen',
    title: 'Takk for bestillingen',
    description: 'Send bekreftelse på mottatt bestilling til kunden.',
    type: 'email',
    workflowId: WORKFLOW_ID,
    workflowStepId: 1,
    preview: pw.getWFOneEmailFormated,
    execute: pw.wfOne,
  },
  {
    seq: 2,
    key: 'ansvarsrett',
    title: 'Ansvarsrett',
    description: 'Send ansvarsrett med vedlegg til aktuelle parter.',
    type: 'upload',
    workflowId: WORKFLOW_ID,
    workflowStepId: 2,
    preview: pw.getWFTwoEmailFormated,
    execute: pw.wfTwo, // multipart, felt: file (én)
  },
  {
    seq: 3,
    key: 'igangsettingstillatelse',
    title: 'Igangsettingstillatelse (IG)',
    description: 'Last opp igangsettingstillatelse-dokumenter.',
    type: 'upload',
    workflowId: WORKFLOW_ID,
    workflowStepId: 3,
    execute: pw.wfThree, // multipart, felt: files (flere)
    multiFile: true,
  },
  {
    seq: 4,
    key: 'godkjent-byggesoknad',
    title: 'Godkjent byggesøknad',
    description: 'Send melding om godkjent byggesøknad.',
    type: 'email',
    workflowId: WORKFLOW_ID,
    workflowStepId: 4,
    preview: pw.getWFFourEmailFormated,
    execute: pw.wfFour,
  },
  {
    seq: 5,
    key: 'opprett-sjekklister',
    title: 'Opprett sjekklister',
    description: 'Bekreft at sjekklister er opprettet for prosjektet.',
    type: 'simple',
    workflowId: WORKFLOW_ID,
    workflowStepId: 5,
    execute: pw.wfFive,
  },
  {
    seq: 6,
    key: 'la-til-foretak',
    title: 'La til foretak',
    description: 'Bekreft at foretak/parter er lagt til.',
    type: 'simple',
    workflowId: WORKFLOW_ID,
    workflowStepId: 6,
    execute: pw.wfSix,
  },
  {
    seq: 7,
    key: 'send-paaminnelse',
    title: 'Send påminnelse',
    description: 'Sett dato for kundepåminnelse.',
    type: 'simple',
    workflowId: WORKFLOW_ID,
    workflowStepId: 7,
    execute: pw.wfSeven,
    dateField: true,
  },
  {
    seq: 8,
    key: 'epost-kommende-kontroll',
    title: 'Epost om kommende kontroll',
    description: 'Varsle parter om kommende kontroll — eller overfør uten å sende.',
    type: 'email',
    workflowId: WORKFLOW_ID,
    workflowStepId: 8,
    preview: pw.getWFEightEmailFormated,
    sendEmail: pw.wfEightSendEmail,
    transfer: pw.wfEightTransfer,
  },
  {
    seq: 9,
    key: 'innhenting-av-dokumentasjon',
    title: 'Innhenting av dokumentasjon',
    description: 'Send forespørsel om dokumentasjon per part — eller overfør uten å sende.',
    type: 'email',
    workflowId: WORKFLOW_ID,
    workflowStepId: 9,
    preview: pw.getWFNineEmailFormated,
    sendEmail: pw.wfNineSendEmail,
    transfer: pw.wfNineTransfer,
    multiRecipient: true,
  },
  {
    seq: 10,
    key: 'kontroll-dato',
    title: 'Kontroll-dato',
    description: 'Sett kontrolldato og tildel inspektør — eller overfør uten kontroll.',
    type: 'date-inspector',
    workflowId: WORKFLOW_ID,
    workflowStepId: 10,
    execute: pw.wfTen,
    transfer: pw.wfTenTransfer,
  },
  {
    seq: 11,
    key: 'gjennomgaa-rapport',
    title: 'Gjennomgå rapport',
    description: 'Godkjenn gjennomgått kontrollrapport.',
    type: 'simple',
    workflowId: WORKFLOW_ID,
    workflowStepId: 11,
    execute: pw.wfElevenDone,
    approve: true,
  },
  {
    seq: 12,
    key: 'send-rapport-dialog',
    title: 'Send rapport (dialog)',
    description: 'Send rapport/avvik til part (WF12). Ikke brukt i gammel admin — eksponert for full dekning.',
    type: 'email',
    workflowId: WORKFLOW_ID,
    workflowStepId: 12,
    preview: pw.getWFTwelveEmailFormated,
    execute: pw.wfTwelve,
  },
  {
    seq: 13,
    key: 'send-faktura',
    title: 'Send faktura',
    description: 'Utløs faktura i Tripletex.',
    type: 'invoice',
    workflowId: WORKFLOW_ID,
    workflowStepId: 15,
    preview: pw.wfFifteenGetDetails,
    execute: pw.wfFifteen,
  },
  {
    seq: 14,
    key: 'kontrollerklaering',
    title: 'Kontrollerklæring',
    description: 'Generer kontrollerklæring (PDF) og send til parter.',
    type: 'pdf',
    workflowId: WORKFLOW_ID,
    workflowStepId: 13,
    preview: pw.getWFThirteenEmailFormated,
    execute: pw.wfThirteen, // multipart, felt: file (én, valgfri)
  },
  {
    seq: 15,
    key: 'sluttrapport',
    title: 'Sluttrapport',
    description: 'Generer sluttrapport (PDF) og send til parter.',
    type: 'pdf',
    workflowId: WORKFLOW_ID,
    workflowStepId: 14,
    preview: pw.getWFFourteenEmailFormated,
    execute: pw.wfFourteen, // multipart, felt: file (én, valgfri)
  },
  {
    seq: 16,
    key: 'utfort',
    title: 'Utført',
    description: 'Fullfør prosjektet og send avsluttende rapport.',
    type: 'pdf',
    workflowId: WORKFLOW_ID,
    workflowStepId: 18,
    preview: pw.getWFFourteenEmailFormated,
    execute: pw.wfFourteen, // gjenbruker WFFourteen med stepId 18
  },
];

/** 用 seq 定位步骤。 */
export function getStepBySeq(seq: number): WorkflowStepDef | undefined {
  return WORKFLOW_STEPS.find((s) => s.seq === seq);
}
