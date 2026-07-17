/**
 * WORKFLOW_STEPS —— 项目工作流(Workflow 1)的「数据驱动步骤注册表」。
 *
 * 设计:后端有 15 个执行步骤(ProjectWFOne..ProjectWFFifteen),UI 展示为旧 admin 的 16 步。
 * 每步声明 { seq, key, titleKey, descriptionKey, type, workflowId, workflowStepId, endpoints, flags }。
 * titleKey/descriptionKey 为 i18n key（workflow.steps.* / workflow.stepDescriptions.*），由渲染组件 t()。
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
  /** 标题 i18n key（workflow.steps.*），渲染组件 t()。 */
  titleKey: string;
  /** 简短说明 i18n key（workflow.stepDescriptions.*），渲染组件 t()。 */
  descriptionKey?: string;
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
    titleKey: 'workflow.steps.takk-for-bestillingen',
    descriptionKey: 'workflow.stepDescriptions.takk-for-bestillingen',
    type: 'email',
    workflowId: WORKFLOW_ID,
    workflowStepId: 1,
    preview: pw.getWFOneEmailFormated,
    execute: pw.wfOne,
  },
  {
    seq: 2,
    key: 'ansvarsrett',
    titleKey: 'workflow.steps.ansvarsrett',
    descriptionKey: 'workflow.stepDescriptions.ansvarsrett',
    type: 'upload',
    workflowId: WORKFLOW_ID,
    workflowStepId: 2,
    preview: pw.getWFTwoEmailFormated,
    execute: pw.wfTwo, // multipart, felt: file (én)
  },
  {
    seq: 3,
    key: 'igangsettingstillatelse',
    titleKey: 'workflow.steps.igangsettingstillatelse',
    descriptionKey: 'workflow.stepDescriptions.igangsettingstillatelse',
    type: 'upload',
    workflowId: WORKFLOW_ID,
    workflowStepId: 3,
    execute: pw.wfThree, // multipart, felt: files (flere)
    multiFile: true,
  },
  {
    seq: 4,
    key: 'godkjent-byggesoknad',
    titleKey: 'workflow.steps.godkjent-byggesoknad',
    descriptionKey: 'workflow.stepDescriptions.godkjent-byggesoknad',
    type: 'email',
    workflowId: WORKFLOW_ID,
    workflowStepId: 4,
    preview: pw.getWFFourEmailFormated,
    execute: pw.wfFour,
  },
  {
    seq: 5,
    key: 'opprett-sjekklister',
    titleKey: 'workflow.steps.opprett-sjekklister',
    descriptionKey: 'workflow.stepDescriptions.opprett-sjekklister',
    type: 'simple',
    workflowId: WORKFLOW_ID,
    workflowStepId: 5,
    execute: pw.wfFive,
  },
  {
    seq: 6,
    key: 'la-til-foretak',
    titleKey: 'workflow.steps.la-til-foretak',
    descriptionKey: 'workflow.stepDescriptions.la-til-foretak',
    type: 'simple',
    workflowId: WORKFLOW_ID,
    workflowStepId: 6,
    execute: pw.wfSix,
  },
  {
    seq: 7,
    key: 'send-paaminnelse',
    titleKey: 'workflow.steps.send-paaminnelse',
    descriptionKey: 'workflow.stepDescriptions.send-paaminnelse',
    type: 'simple',
    workflowId: WORKFLOW_ID,
    workflowStepId: 7,
    execute: pw.wfSeven,
    dateField: true,
  },
  {
    seq: 8,
    key: 'epost-kommende-kontroll',
    titleKey: 'workflow.steps.epost-kommende-kontroll',
    descriptionKey: 'workflow.stepDescriptions.epost-kommende-kontroll',
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
    titleKey: 'workflow.steps.innhenting-av-dokumentasjon',
    descriptionKey: 'workflow.stepDescriptions.innhenting-av-dokumentasjon',
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
    titleKey: 'workflow.steps.kontroll-dato',
    descriptionKey: 'workflow.stepDescriptions.kontroll-dato',
    type: 'date-inspector',
    workflowId: WORKFLOW_ID,
    workflowStepId: 10,
    execute: pw.wfTen,
    transfer: pw.wfTenTransfer,
  },
  {
    seq: 11,
    key: 'gjennomgaa-rapport',
    titleKey: 'workflow.steps.gjennomgaa-rapport',
    descriptionKey: 'workflow.stepDescriptions.gjennomgaa-rapport',
    type: 'simple',
    workflowId: WORKFLOW_ID,
    workflowStepId: 11,
    execute: pw.wfElevenDone,
    approve: true,
  },
  {
    seq: 12,
    key: 'send-rapport-dialog',
    titleKey: 'workflow.steps.send-rapport-dialog',
    descriptionKey: 'workflow.stepDescriptions.send-rapport-dialog',
    type: 'email',
    workflowId: WORKFLOW_ID,
    workflowStepId: 12,
    preview: pw.getWFTwelveEmailFormated,
    execute: pw.wfTwelve,
  },
  {
    seq: 13,
    key: 'send-faktura',
    titleKey: 'workflow.steps.send-faktura',
    descriptionKey: 'workflow.stepDescriptions.send-faktura',
    type: 'invoice',
    workflowId: WORKFLOW_ID,
    workflowStepId: 15,
    preview: pw.wfFifteenGetDetails,
    execute: pw.wfFifteen,
  },
  {
    seq: 14,
    key: 'kontrollerklaering',
    titleKey: 'workflow.steps.kontrollerklaering',
    descriptionKey: 'workflow.stepDescriptions.kontrollerklaering',
    type: 'pdf',
    workflowId: WORKFLOW_ID,
    workflowStepId: 13,
    preview: pw.getWFThirteenEmailFormated,
    execute: pw.wfThirteen, // multipart, felt: file (én, valgfri)
  },
  {
    seq: 15,
    key: 'sluttrapport',
    titleKey: 'workflow.steps.sluttrapport',
    descriptionKey: 'workflow.stepDescriptions.sluttrapport',
    type: 'pdf',
    workflowId: WORKFLOW_ID,
    workflowStepId: 14,
    preview: pw.getWFFourteenEmailFormated,
    execute: pw.wfFourteen, // multipart, felt: file (én, valgfri)
  },
  {
    seq: 16,
    key: 'utfort',
    titleKey: 'workflow.steps.utfort',
    descriptionKey: 'workflow.stepDescriptions.utfort',
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
