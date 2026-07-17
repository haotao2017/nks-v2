/**
 * @nks/api-types —— NKS 后端线上契约的 TypeScript 类型总出口。
 *
 * 说明:model 层已统一用 `Api` 前缀 / `Wrapper` 等命名避免同名冲突,
 * 经全量核对(见任务报告),各 model 文件之间无重复导出,common/endpoints
 * 与 model 之间亦无同名冲突,故此处全部直接 `export *`,无需重命名消歧。
 */

// 共享基础类型
export * from './common';

// 端点目录
export * from './endpoints';

// 领域模型
export * from './models/auth';
export * from './models/contact';
export * from './models/service';
export * from './models/party-type';
export * from './models/doc-type';
export * from './models/building-supplier';
export * from './models/email-template';
export * from './models/workflow-category';
export * from './models/company';
export * from './models/user';
export * from './models/misc';
export * from './models/project';
export * from './models/checklist';
export * from './models/checklist-insp';
export * from './models/party';
export * from './models/doc';
export * from './models/workflow';
export * from './models/mobile';
