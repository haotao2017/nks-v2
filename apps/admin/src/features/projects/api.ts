'use client';

/**
 * Project 数据访问层 —— 汇总项目模块全部 hooks。照抄 features/contacts/api.ts 结构。
 *
 * 端点(来自 @nks/api-types 的 endpoints.project.*):
 *  - useProjectsCount        GET    /Project/GetProjectsCount                    → ProjectCountDto(无包装)
 *  - useActiveProjects       GET    /Project/GetAllProjectListNotArchivedOrDeleted?EntriesFrom&EntriesTill
 *                                                                                → 解包 res.multiProject(ProjectListDto[] 精简:id/title/dated)
 *  - useArchivedProjects     GET    /Project/GetAllArchivedProjectList?EntriesFrom&EntriesTill → 解包 res.multiProject(ProjectDto[] 全量)
 *  - useDeletedProjects      GET    /Project/GetAllDeletedProjectList?EntriesFrom&EntriesTill  → 解包 res.multiProject(ProjectDto[] 全量)
 *  - useProject              GET    /Project/GetProject?ProjectID                → 解包 res.project
 *  - useCreateProject        POST   /Project/CreatProject                        → body { project }, 解包 res.project
 *  - useUpdateProject        PUT    /Project/UpdateProject                       → body { project }, 解包 res.project
 *  - useDeleteProject        DELETE /Project/DeleteProject?ProjectID&isDelete    → DeleteProjectResponseDto{message,success}
 *  - useArchiveProject       GET    /Project/ArchiveProject?ProjectID&isArchive  → DeleteProjectResponseDto{message,success}
 *  - useProjectChecklists    GET    /Project/GetAllProjectChecklists?ProjectID   → 解包 res.multiProjectChecklist
 *  - useProjectParties       GET    /Project/GetAllProjectPartiesByProjectID?ProjectID → 解包 res.multiProjectParty
 *
 * 注意:
 *  - 创建/更新请求体与响应根键均为小写 `project`(WrapperProjectDto,与 Contact 的大写 `Contact` 不同)。
 *  - 参数名为后端 PascalCase:ProjectID / EntriesFrom / EntriesTill / isDelete / isArchive。
 *  - 活动列表端点返回精简 ProjectListDto(仅 id/title/dated),无 address/status;
 *    归档/删除列表返回全量 ProjectDto。列渲染对缺失字段回退 '—'。
 *  - GetAllProjectListNotArchivedOrDeleted / Archived / Deleted 均需 EntriesFrom/EntriesTill;
 *    这里一次取较大区间(0..DEFAULT_ENTRIES_TILL),分页/搜索交给 DataTable 客户端处理。
 *  - 删除/归档为后端「HTTP 200 但 success:false」软失败模式,success===false 时抛错交由 toast。
 */
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  ProjectDto,
  ProjectListDto,
  ProjectCountDto,
  DeleteProjectResponseDto,
  WrapperProjectDto,
  ProjectChecklistSimpleDto,
  ProjectPartyDto,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** 一次拉取的最大条数(后端要求 EntriesFrom/EntriesTill 区间)。 */
const DEFAULT_ENTRIES_FROM = 0;
const DEFAULT_ENTRIES_TILL = 1000;

/** GetAll* 的响应形状:{ multiProject: T[] }。 */
interface GetAllProjectsResponse<T> {
  multiProject?: T[];
}

/** GetAllProjectChecklists 响应:{ multiProjectChecklist: ProjectChecklistSimpleDto[] }。 */
interface GetProjectChecklistsResponse {
  multiProjectChecklist?: ProjectChecklistSimpleDto[];
}

/** GetAllProjectPartiesByProjectID 响应:{ multiProjectParty: ProjectPartyDto[] }。 */
interface GetProjectPartiesResponse {
  multiProjectParty?: ProjectPartyDto[];
}

/** 统一的查询 key —— 复用于失效重拉。 */
export const projectKeys = {
  all: ['projects'] as const,
  count: () => [...projectKeys.all, 'count'] as const,
  list: (variant: 'active' | 'archived' | 'deleted') =>
    [...projectKeys.all, 'list', variant] as const,
  detail: (id: number) => [...projectKeys.all, 'detail', id] as const,
  checklists: (id: number) => [...projectKeys.all, 'checklists', id] as const,
  parties: (id: number) => [...projectKeys.all, 'parties', id] as const,
};

/** 项目计数(活动/归档/删除)。无包装,直接返回 ProjectCountDto。 */
export function useProjectsCount() {
  return useQuery({
    queryKey: projectKeys.count(),
    queryFn: async () =>
      getApiClient().get<ProjectCountDto>(endpoints.project.getCount.path),
  });
}

/** 活动项目列表(未归档未删除)。返回精简 ProjectListDto[]。 */
export function useActiveProjects() {
  return useQuery({
    queryKey: projectKeys.list('active'),
    queryFn: async () => {
      const res = await getApiClient().get<GetAllProjectsResponse<ProjectListDto>>(
        endpoints.project.getAllListNotArchivedOrDeleted.path,
        { params: { EntriesFrom: DEFAULT_ENTRIES_FROM, EntriesTill: DEFAULT_ENTRIES_TILL } },
      );
      return res?.multiProject ?? [];
    },
  });
}

/** 已归档项目列表。返回全量 ProjectDto[]。 */
export function useArchivedProjects() {
  return useQuery({
    queryKey: projectKeys.list('archived'),
    queryFn: async () => {
      const res = await getApiClient().get<GetAllProjectsResponse<ProjectDto>>(
        endpoints.project.getAllArchivedList.path,
        { params: { EntriesFrom: DEFAULT_ENTRIES_FROM, EntriesTill: DEFAULT_ENTRIES_TILL } },
      );
      return res?.multiProject ?? [];
    },
  });
}

/** 已删除项目列表。返回全量 ProjectDto[]。 */
export function useDeletedProjects() {
  return useQuery({
    queryKey: projectKeys.list('deleted'),
    queryFn: async () => {
      const res = await getApiClient().get<GetAllProjectsResponse<ProjectDto>>(
        endpoints.project.getAllDeletedList.path,
        { params: { EntriesFrom: DEFAULT_ENTRIES_FROM, EntriesTill: DEFAULT_ENTRIES_TILL } },
      );
      return res?.multiProject ?? [];
    },
  });
}

/** 单个项目详情。参数 ProjectID;解包 res.project。 */
export function useProject(projectId: number | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? -1),
    enabled: typeof projectId === 'number' && projectId > 0,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperProjectDto>(
        endpoints.project.get.path,
        { params: { ProjectID: projectId! } },
      );
      return res?.project;
    },
  });
}

/** 创建项目。body 根键小写 project;返回 res.project。 */
export function useCreateProject() {
  return useApiMutation<ProjectDto | undefined, ProjectDto>({
    mutationFn: async (project) => {
      const body: WrapperProjectDto = { project };
      const res = await getApiClient().post<WrapperProjectDto>(
        endpoints.project.create.path,
        body,
      );
      return res?.project;
    },
    invalidateKeys: [projectKeys.list('active'), projectKeys.count()],
    successMessage: 'Prosjekt opprettet',
    errorMessage: 'Kunne ikke opprette prosjekt',
  });
}

/** 更新项目。body 根键小写 project;返回 res.project。 */
export function useUpdateProject() {
  return useApiMutation<ProjectDto | undefined, ProjectDto>({
    mutationFn: async (project) => {
      const body: WrapperProjectDto = { project };
      const res = await getApiClient().put<WrapperProjectDto>(
        endpoints.project.update.path,
        body,
      );
      return res?.project;
    },
    invalidateKeys: [projectKeys.all],
    successMessage: 'Prosjekt oppdatert',
    errorMessage: 'Kunne ikke oppdatere prosjekt',
  });
}

/**
 * 软删除 / 恢复项目。参数 ProjectID + isDelete。
 * isDelete=true 软删,false 恢复。success===false 视为软失败并抛错。
 */
export function useDeleteProject() {
  return useApiMutation<
    DeleteProjectResponseDto,
    { projectId: number; isDelete: boolean }
  >({
    mutationFn: async ({ projectId, isDelete }) => {
      const res = await getApiClient().delete<DeleteProjectResponseDto>(
        endpoints.project.delete.path,
        { params: { ProjectID: projectId, isDelete } },
      );
      if (res?.success === false) {
        throw new Error(res.message || 'Handlingen mislyktes');
      }
      return res;
    },
    invalidateKeys: [
      projectKeys.list('active'),
      projectKeys.list('deleted'),
      projectKeys.count(),
    ],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(data?.message || 'Prosjekt oppdatert');
    },
  });
}

/**
 * 归档 / 取消归档项目。GET,参数 ProjectID + isArchive。
 * isArchive=true 归档,false 取消归档。success===false 视为软失败并抛错。
 */
export function useArchiveProject() {
  return useApiMutation<
    DeleteProjectResponseDto,
    { projectId: number; isArchive: boolean }
  >({
    mutationFn: async ({ projectId, isArchive }) => {
      const res = await getApiClient().get<DeleteProjectResponseDto>(
        endpoints.project.archive.path,
        { params: { ProjectID: projectId, isArchive } },
      );
      if (res?.success === false) {
        throw new Error(res.message || 'Handlingen mislyktes');
      }
      return res;
    },
    invalidateKeys: [
      projectKeys.list('active'),
      projectKeys.list('archived'),
      projectKeys.count(),
    ],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(data?.message || 'Prosjekt oppdatert');
    },
  });
}

/** 项目检查清单列表。参数 ProjectID;解包 res.multiProjectChecklist。 */
export function useProjectChecklists(projectId: number | undefined) {
  return useQuery({
    queryKey: projectKeys.checklists(projectId ?? -1),
    enabled: typeof projectId === 'number' && projectId > 0,
    queryFn: async () => {
      const res = await getApiClient().get<GetProjectChecklistsResponse>(
        endpoints.project.getAllChecklists.path,
        { params: { ProjectID: projectId! } },
      );
      return res?.multiProjectChecklist ?? [];
    },
  });
}

/** 项目参与方列表。参数 ProjectID;解包 res.multiProjectParty。 */
export function useProjectParties(projectId: number | undefined) {
  return useQuery({
    queryKey: projectKeys.parties(projectId ?? -1),
    enabled: typeof projectId === 'number' && projectId > 0,
    queryFn: async () => {
      const res = await getApiClient().get<GetProjectPartiesResponse>(
        endpoints.project.getAllPartiesByProjectId.path,
        { params: { ProjectID: projectId! } },
      );
      return res?.multiProjectParty ?? [];
    },
  });
}
