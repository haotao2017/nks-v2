/**
 * activeProject 数据访问 —— 加载组装 + 写操作的线上形状构造。
 *
 * 读(camelCase 读模型,对齐 @nks/api-types 的 dto/api 派生形状):
 *  - ProjectDetail  GET  /MobileApp/ProjectDetail?projectID=  → ProjectDetailContainer
 *  - ChecklistItems GET  /MobileApp/ChecklistItems?ChecklistID= → ChecklistItemContainer
 *  inspectionDate/projectName 走列表项(Login)种子,description/联系人/图走 detail。
 *
 * 写(照旧客户端真实线上形状,PascalCase 包装;后端对入参大小写不敏感):
 *  - ProjectUpdate  POST multipart /MobileApp/ProjectUpdate
 *      request 部件 = JSON.stringify({ ProjectUpdate: { ProjectId, ProjectDate, ProjectDescription } })
 *      图片部件名 = "image"(单张外景图)
 *  - ChecklistUpdate POST multipart /MobileApp/ChecklistUpdate(供后续清单屏复用)
 *      request 部件 = JSON.stringify({ ChecklistItem: { ProjectId, CheckListID, QuestionID, Status, Comment } })
 *      图片部件名 = "image0" / "image1" ...
 */
import type {
  ChecklistItemContainer,
  Login,
  ProjectDetailContainer,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import type {
  LocalChecklist,
  LocalProjectDetail,
} from '@/store/active-project-slice';

import { isLocalImageUri, uriToFormDataPart } from './image';
import {
  normalizeChecklistStatus,
  type ChecklistStatus,
} from './status';

/** 列表项种子(用于补 inspectionDate / projectName,detail 端点不返回)。 */
export type ProjectSeed = Pick<
  Login,
  'projectID' | 'projectName' | 'projectDetail' | 'inspectionDate'
>;

/**
 * 打开项目:拉 ProjectDetail + 每张清单的 ChecklistItems,组装本地可编辑副本。
 * @param seed 来自项目列表缓存(补 inspectionDate / projectName)。
 */
export async function assembleActiveProject(
  projectId: string,
  seed?: ProjectSeed,
): Promise<LocalProjectDetail> {
  const client = getApiClient();

  const detailRes = await client.get<ProjectDetailContainer>(
    endpoints.mobileApp.projectDetail.path,
    { params: { projectID: projectId } },
  );
  const d = detailRes?.projectDetail;
  if (!d) throw new Error('Fant ikke prosjektdetaljer');

  const checklistsMeta = detailRes.listOfChecklists ?? [];
  const checklists: LocalChecklist[] = await Promise.all(
    checklistsMeta.map(async (c) => {
      const clRes = await client.get<ChecklistItemContainer>(
        endpoints.mobileApp.checklistItems.path,
        { params: { ChecklistID: c.checklistId ?? '' } },
      );
      const items = clRes?.listOfChecklistItems ?? [];
      return {
        checklistId: String(c.checklistId ?? ''),
        checklistName: c.checklistName ?? '',
        checkItems: items.map((it) => ({
          checklistItemId: String(it.checklistItemID ?? ''),
          question: it.question ?? '',
          status: normalizeChecklistStatus(it.status),
          comment: it.comment ?? null,
          itemImageUrls: it.itemImageUrls ?? [],
          updated: true,
        })),
      };
    }),
  );

  return {
    projectID: String(projectId),
    projectName: seed?.projectName ?? d.projectTitle ?? 'Uten navn',
    inspectionDate: seed?.inspectionDate ?? d.createdOn ?? '',
    description: d.description ?? seed?.projectDetail ?? '',
    address: d.address ?? '',
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
    projectLeader: { name: d.leaderName ?? '', number: d.leaderNumber ?? '' },
    flisLegger: { name: d.flislegerName ?? '', number: d.flislegerNumber ?? '' },
    exteriorImage: d.siteImageUrl || null,
    floorPlanUrl: d.floorPlanUrl || null,
    checklists,
    projectDirty: false,
  };
}

// FormData.append 的文件部件:RN 接受 {uri,type,name},DOM 类型是 Blob,故 cast。
function appendFilePart(form: FormData, field: string, part: { uri: string; type: string; name: string }) {
  form.append(field, part as unknown as Blob);
}

export interface ProjectUpdateInput {
  projectID: string;
  /** 检验日期(原样字符串或 ISO)。 */
  projectDate: string;
  projectDescription: string;
  /** 新的本地外景图 URI(file://);远程 https 不重传。 */
  newImageUri?: string | null;
}

/** 构造 ProjectUpdate 的 multipart（PascalCase 包装 + image 部件）。 */
export async function buildProjectUpdateForm(input: ProjectUpdateInput): Promise<FormData> {
  const payload = {
    ProjectUpdate: {
      ProjectId: input.projectID,
      ProjectDate: input.projectDate,
      ProjectDescription: input.projectDescription,
    },
  };
  const form = new FormData();
  form.append('request', JSON.stringify(payload));
  if (input.newImageUri && isLocalImageUri(input.newImageUri)) {
    appendFilePart(form, 'image', await uriToFormDataPart(input.newImageUri, 'exterior'));
  }
  return form;
}

export function postProjectUpdate(form: FormData) {
  return getApiClient().postForm(endpoints.mobileApp.projectUpdate.path, form);
}

export interface ChecklistUpdateInput {
  projectID: string;
  checklistId: string;
  checklistItemId: string;
  status: ChecklistStatus | null;
  comment: string | null;
  imageUris?: string[];
}

/** 构造 ChecklistUpdate 的 multipart（PascalCase 包装 + image0/image1... 部件）。供清单屏复用。 */
export async function buildChecklistUpdateForm(input: ChecklistUpdateInput): Promise<FormData> {
  const payload = {
    ChecklistItem: {
      ProjectId: input.projectID,
      CheckListID: input.checklistId,
      QuestionID: input.checklistItemId,
      Status: input.status,
      Comment: input.comment,
    },
  };
  const form = new FormData();
  form.append('request', JSON.stringify(payload));
  let idx = 0;
  for (const uri of input.imageUris ?? []) {
    if (!isLocalImageUri(uri)) continue; // 已上传的远程图不重传
    appendFilePart(form, `image${idx}`, await uriToFormDataPart(uri, `checklist-${idx}`));
    idx++;
  }
  return form;
}

export function postChecklistUpdate(form: FormData) {
  return getApiClient().postForm(endpoints.mobileApp.checklistUpdate.path, form);
}

// —— 最终提交（ProjectSubmit）+ 提交日志（Log），照旧客户端 Submit.tsx 的线上形状。——

export interface ProjectSubmitInput {
  projectID: string;
  /** 提交时间(ISO 串,旧客户端用 new Date().toISOString())。 */
  submitDate: string;
  /** 检验员总评/备注。 */
  inspectorComments: string;
  /** 手写签名图(base64 data URL,react-native-signature-canvas 产出)。 */
  inspectorSignature: string;
}

/**
 * 最终提交：POST /MobileApp/ProjectSubmit（非 multipart,JSON body）。
 * 请求体照旧客户端 PascalCase 包装:{ ProjectSubmit: { ProjectId, ProjectSubmitDate,
 * InspectorComments, InspectorSignature } }。签名图按旧客户端方式作为字符串字段随 JSON 提交。
 */
export function postProjectSubmit(input: ProjectSubmitInput) {
  const payload = {
    ProjectSubmit: {
      ProjectId: input.projectID,
      ProjectSubmitDate: input.submitDate,
      InspectorComments: input.inspectorComments,
      InspectorSignature: input.inspectorSignature,
    },
  };
  return getApiClient().post(endpoints.mobileApp.projectSubmit.path, payload);
}

/** Log 单条(旧客户端读 res[0].dateTime)。 */
interface LogEntry {
  dateTime?: string;
}

/**
 * 取上次提交时间：GET /MobileApp/Log?projectID=（参数名照旧客户端）。
 * 旧客户端读返回数组的 res[0].dateTime;无记录返回 null。
 */
export async function fetchLastSubmitted(projectID: string): Promise<string | null> {
  const res = await getApiClient().get<LogEntry[]>(endpoints.mobileApp.log.path, {
    params: { projectID },
  });
  return res?.[0]?.dateTime ?? null;
}
