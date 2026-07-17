import { z } from 'zod';

/**
 * 新建/编辑项目向导的表单 schema。
 * 覆盖核心可编辑字段;其余 ProjectDto 字段在编辑时原样保留(见 project-wizard.tsx 的合并逻辑)。
 * Select 值统一用 string 承接(空串表示未选),提交时转 number。
 */
export const serviceRowSchema = z.object({
  serviceId: z.string().min(1, 'Velg en tjeneste'),
  quantity: z.string().optional(),
  price: z.string().optional(),
});

export const wizardSchema = z.object({
  // Steg 1 —— ProjectInfo
  title: z.string().trim().min(1, 'Tittel er påkrevd'),
  address: z.string().optional(),
  gardsNo: z.string().optional(),
  bruksnmmer: z.string().optional(),
  kommune: z.string().optional(),
  postNo: z.string().optional(),
  poststed: z.string().optional(),
  description: z.string().optional(),
  comments: z.string().optional(),
  longitude: z.string().optional(),
  latitude: z.string().optional(),
  // Steg 2 —— CustomerInfo
  customerId: z.string().optional(),
  contactPersonId: z.string().optional(),
  // Steg 3 —— Pricing
  services: z.array(serviceRowSchema),
});

export type WizardValues = z.infer<typeof wizardSchema>;

/** 每步用于 form.trigger 的字段(仅第一步含必填校验)。 */
export const stepFields: (keyof WizardValues)[][] = [
  ['title', 'address', 'gardsNo', 'bruksnmmer', 'kommune', 'postNo', 'poststed', 'description', 'comments', 'longitude', 'latitude'],
  ['customerId', 'contactPersonId'],
  ['services'],
];
