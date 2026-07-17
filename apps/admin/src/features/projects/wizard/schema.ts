import type { TFunction } from 'i18next';
import { z } from 'zod';

/**
 * 新建/编辑项目向导的表单 schema。
 * 覆盖核心可编辑字段;其余 ProjectDto 字段在编辑时原样保留(见 project-wizard.tsx 的合并逻辑)。
 * Select 值统一用 string 承接(空串表示未选),提交时转 number。
 *
 * 必填项严格对齐旧系统 ProjectHeader.js 的校验 keyArray:
 *   address, bruksnmmer, gardsNo, postNo, kommune, poststed,
 *   buildingSupplierId, contactPersonId, customerId
 * 且 services(projectService)至少一条(旧系统 "You must add a service")。
 * 旧系统无 title 输入,故 schema 不含 title(见 project-wizard.tsx 的 title 处理说明)。
 *
 * 校验消息走 i18n:makeWizardSchema(t)(与 team/user-form-dialog 的 makeUserSchema 一致)。
 */
export const makeServiceRowSchema = (t: TFunction) =>
  z.object({
    /** 已存在服务行携带 ProjectServiceID(编辑模式删除时用);新增行无 id。 */
    id: z.string().optional(),
    serviceId: z.string().min(1, t('projectWizard.validation.service')),
    quantity: z.string().optional(),
    price: z.string().optional(),
  });

export const makeWizardSchema = (t: TFunction) =>
  z.object({
    // Steg 2 —— ProjectInfo
    address: z.string().trim().min(1, t('projectWizard.validation.address')),
    gardsNo: z.string().trim().min(1, t('projectWizard.validation.gardsNo')),
    bruksnmmer: z.string().trim().min(1, t('projectWizard.validation.bruksnummer')),
    postNo: z.string().trim().min(1, t('projectWizard.validation.postNo')),
    poststed: z.string().trim().min(1, t('projectWizard.validation.poststed')),
    kommune: z.string().trim().min(1, t('projectWizard.validation.kommune')),
    buildingSupplierId: z.string().min(1, t('projectWizard.validation.buildingSupplier')),
    description: z.string().optional(),
    comments: z.string().optional(),
    longitude: z.string().optional(),
    latitude: z.string().optional(),
    // Steg 1 —— ContactInfo
    customerId: z.string().min(1, t('projectWizard.validation.customer')),
    contactPersonId: z.string().min(1, t('projectWizard.validation.contactPerson')),
    // Steg 3 —— Pricing
    services: z.array(makeServiceRowSchema(t)).min(1, t('projectWizard.validation.servicesMin')),
  });

export type WizardValues = z.infer<ReturnType<typeof makeWizardSchema>>;

/**
 * 每步用于 form.trigger 的字段。步骤顺序:ContactInfo → ProjectInfo → Pricing。
 * buildingSupplierId 属于 ProjectInfo(旧系统 Husleverandør 在该 tab);
 * customerId/contactPersonId 属于 ContactInfo。
 */
export const stepFields: (keyof WizardValues)[][] = [
  ['customerId', 'contactPersonId'],
  [
    'address',
    'gardsNo',
    'bruksnmmer',
    'postNo',
    'poststed',
    'kommune',
    'buildingSupplierId',
    'description',
    'comments',
    'longitude',
    'latitude',
  ],
  ['services'],
];
