/**
 * activeProject slice —— 「当前打开项目」的本地可编辑副本(离线优先命脉)。
 *
 * 设计:
 *  - 打开项目时把 ProjectDetail + 每张清单的 ChecklistItems 组装成本地副本存入此处,
 *    并 redux-persist 落 AsyncStorage(白名单 projectId + detail),冷启动/离线即时渲染。
 *  - 任何编辑(项目描述/日期/外景图,或清单项状态/备注/图)先写本地副本 + 持久化;
 *    联网时才推送后端(见 features/active-project/sync.ts),成功后置同步标志去重:
 *      · 项目级用 detail.projectDirty(true=有未同步的本地改动)
 *      · 清单项级用 item.updated(true=已成功同步后端)
 *  - status/error 为瞬态,不持久化;screen 以 detail 是否存在决定能否即时渲染。
 *
 * 字段命名遵循旧客户端的本地模型(camelCase 读模型),写操作的线上形状在
 * features/active-project/api.ts 里转成旧后端认的 PascalCase 包装。
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** 清单项三态(挪威语业务值,照旧客户端)。 */
export type ChecklistStatus = 'OK' | 'Avvik' | 'IA';

export interface LocalContact {
  name: string;
  number: string;
}

export interface LocalChecklistItem {
  checklistItemId: string;
  question: string;
  status: ChecklistStatus | null;
  comment: string | null;
  /** 图片 URI:远程 https(已上传)或本地 file://(待上传)。 */
  itemImageUrls: string[];
  /** true=已成功同步后端(去重用);本地编辑后置 false。 */
  updated: boolean;
}

export interface LocalChecklist {
  checklistId: string;
  checklistName: string;
  checkItems: LocalChecklistItem[];
}

export interface LocalProjectDetail {
  projectID: string;
  projectName: string;
  /** 检验日期:服务端原样字符串,或用户改期后的 ISO 串。ProjectUpdate 原样回传。 */
  inspectionDate: string;
  /** 项目描述(ProjectUpdate 的 ProjectDescription)。 */
  description: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  projectLeader: LocalContact;
  flisLegger: LocalContact;
  /** 外景图 URI:远程 https(服务端 siteImageUrl)或本地 file://(新拍/新选待传)。 */
  exteriorImage: string | null;
  floorPlanUrl: string | null;
  checklists: LocalChecklist[];
  /** true=项目级(Info/Exterior)有未同步的本地改动。 */
  projectDirty: boolean;
}

export type ActiveProjectStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ActiveProjectState {
  projectId: string | null;
  detail: LocalProjectDetail | null;
  status: ActiveProjectStatus;
  error: string | null;
}

const initialState: ActiveProjectState = {
  projectId: null,
  detail: null,
  status: 'idle',
  error: null,
};

export interface PatchProjectFieldsPayload {
  inspectionDate?: string;
  description?: string;
  exteriorImage?: string | null;
}

export interface PatchChecklistItemPayload {
  checklistId: string;
  checklistItemId: string;
  patch: Partial<Pick<LocalChecklistItem, 'status' | 'comment' | 'itemImageUrls'>>;
}

const activeProjectSlice = createSlice({
  name: 'activeProject',
  initialState,
  reducers: {
    /** 开始加载某项目;若持久化副本属于别的项目则先清空,避免串数据。 */
    beginLoad(state, action: PayloadAction<string>) {
      if (state.detail && state.detail.projectID !== action.payload) {
        state.detail = null;
      }
      state.projectId = action.payload;
      state.status = 'loading';
      state.error = null;
    },
    /** 组装完成:写入本地副本(视为与后端一致,清同步标志)。 */
    loadSucceeded(state, action: PayloadAction<LocalProjectDetail>) {
      state.detail = action.payload;
      state.projectId = action.payload.projectID;
      state.status = 'ready';
      state.error = null;
    },
    loadFailed(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error = action.payload;
    },
    clearActiveProject() {
      return initialState;
    },
    /** 项目级本地写(描述/日期/外景图),置 projectDirty。 */
    patchProjectFields(state, action: PayloadAction<PatchProjectFieldsPayload>) {
      if (!state.detail) return;
      const { inspectionDate, description, exteriorImage } = action.payload;
      if (inspectionDate !== undefined) state.detail.inspectionDate = inspectionDate;
      if (description !== undefined) state.detail.description = description;
      if (exteriorImage !== undefined) state.detail.exteriorImage = exteriorImage;
      state.detail.projectDirty = true;
    },
    /** 项目级同步成功,清 projectDirty。 */
    markProjectSynced(state) {
      if (state.detail) state.detail.projectDirty = false;
    },
    /** 清单项本地写,置 updated=false(待同步)。 */
    patchChecklistItem(state, action: PayloadAction<PatchChecklistItemPayload>) {
      const { checklistId, checklistItemId, patch } = action.payload;
      const item = state.detail?.checklists
        .find((c) => c.checklistId === checklistId)
        ?.checkItems.find((i) => i.checklistItemId === checklistItemId);
      if (!item) return;
      if (patch.status !== undefined) item.status = patch.status;
      if (patch.comment !== undefined) item.comment = patch.comment;
      if (patch.itemImageUrls !== undefined) item.itemImageUrls = patch.itemImageUrls;
      item.updated = false;
    },
    /** 清单项同步成功,置 updated=true(去重)。 */
    markChecklistItemSynced(
      state,
      action: PayloadAction<{ checklistId: string; checklistItemId: string }>,
    ) {
      const item = state.detail?.checklists
        .find((c) => c.checklistId === action.payload.checklistId)
        ?.checkItems.find((i) => i.checklistItemId === action.payload.checklistItemId);
      if (item) item.updated = true;
    },
  },
});

export const {
  beginLoad,
  loadSucceeded,
  loadFailed,
  clearActiveProject,
  patchProjectFields,
  markProjectSynced,
  patchChecklistItem,
  markChecklistItemSynced,
} = activeProjectSlice.actions;

export default activeProjectSlice.reducer;
