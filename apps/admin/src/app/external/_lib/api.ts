/**
 * 外部参与方(免登录)接口封装 —— endpoints.partyDoc.*(auth: 'urlkey')。
 *
 * 端点无需 JWT:api-client 单例在无 token 时不会带 Authorization 头,后端已放行 /api/PartyDoc/**。
 * GET 用 PascalCase query 参数(后端 @RequestParam);上传用 multipart(postForm),
 * 字段名与后端一致:`request`(JSON 字符串)+ `files`(可多值)。
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@nks/api-types';
import type {
  WrapperProjectPartyDocsMulti,
  WrapperProjectPartyDocsSingle,
  WrapperProjectSinglePartyDocsUploadedFileList,
  CountProjectPartyDocsUploaded,
  WrapperProjectPartyDocsInspection,
  RequestResponse,
} from '@nks/api-types';

import { getApiClient } from '@/lib/api';
import type { PartyParams } from './params';

/** 后端 GET 接口共用的 PascalCase query 参数。 */
function baseQuery(p: PartyParams) {
  return {
    WorkflowId: p.workflowId,
    ProjectID: p.projectId,
    PartyID: p.partyId,
    PartyTypeID: p.partyTypeId,
    UrlKey: p.urlKey,
  };
}

/** JSON body(wrapper)共用的 camelCase 键 —— 对齐 Jackson 序列化的 Java 字段名。 */
function baseWrapper(p: PartyParams) {
  return {
    workflowId: Number(p.workflowId),
    projectID: Number(p.projectId),
    partyID: Number(p.partyId),
    partyTypeID: Number(p.partyTypeId),
    urlKey: p.urlKey,
  };
}

/* -------------------------------------------------------------------------- */
/* UploadDocument                                                             */
/* -------------------------------------------------------------------------- */

const uploadKeys = {
  required: (p: PartyParams) => ['party-doc', 'required', p.projectId, p.partyId] as const,
  uploaded: (p: PartyParams) => ['party-doc', 'uploaded', p.projectId, p.partyId] as const,
  count: (p: PartyParams) => ['party-doc', 'count', p.projectId, p.partyId] as const,
};

/** 该参与方需上传的文档清单(DocTypeDto[])。 */
export function useRequiredDocs(p: PartyParams, enabled: boolean) {
  return useQuery({
    queryKey: uploadKeys.required(p),
    enabled,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperProjectPartyDocsMulti>(
        endpoints.partyDoc.getDocumentsListRequiredFromParty.path,
        { params: baseQuery(p) },
      );
      return res?.projectPartyDocsMulti ?? [];
    },
  });
}

/** 已上传文件清单(ProjectSinglePartyDocsFilesListDto[])。 */
export function useUploadedFiles(p: PartyParams, enabled: boolean) {
  return useQuery({
    queryKey: uploadKeys.uploaded(p),
    enabled,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperProjectSinglePartyDocsUploadedFileList>(
        endpoints.partyDoc.getProjectSinglePartyDocsUploadedFileList.path,
        { params: baseQuery(p) },
      );
      return res?.filesList ?? [];
    },
  });
}

/** 已上传数量(按文档类型)。 */
export function useUploadedCount(p: PartyParams, enabled: boolean) {
  return useQuery({
    queryKey: uploadKeys.count(p),
    enabled,
    queryFn: async () => {
      const res = await getApiClient().get<CountProjectPartyDocsUploaded>(
        endpoints.partyDoc.getDocumentsListCountUploadByParty.path,
        { params: baseQuery(p) },
      );
      return res ?? null;
    },
  });
}

/**
 * 上传某文档类型的文件(multipart)。
 * request(JSON): WrapperProjectPartyDocsSingle,其 projectPartyDocsSingle.partyDocTypeId 指定文档类型;
 * files: 该类型选中的文件(可多个,同名字段 `files`)。
 */
export function useUploadDocs(p: PartyParams) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ docTypeId, files }: { docTypeId: number; files: File[] }) => {
      const request: WrapperProjectPartyDocsSingle = {
        ...baseWrapper(p),
        projectPartyDocsSingle: { partyDocTypeId: docTypeId },
      };
      const fd = new FormData();
      fd.append('request', JSON.stringify(request));
      for (const f of files) fd.append('files', f);

      const res = await getApiClient().postForm<RequestResponse>(
        endpoints.partyDoc.uploadDocumentFromParty.path,
        fd,
      );
      if (res && res.success === false) {
        throw new Error(res.message || 'Opplasting feilet');
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: uploadKeys.uploaded(p) });
      qc.invalidateQueries({ queryKey: uploadKeys.count(p) });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* UpdateDeviation                                                            */
/* -------------------------------------------------------------------------- */

const deviationKeys = {
  data: (p: PartyParams) => ['party-inspection', p.projectId, p.partyId, p.ckii] as const,
};

/** 检查项的检验数据/偏差(含已上传图片 imageURL)。 */
export function useInspectionData(p: PartyParams, enabled: boolean) {
  return useQuery({
    queryKey: deviationKeys.data(p),
    enabled,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperProjectPartyDocsInspection>(
        endpoints.partyDoc.getChecklistItemInspectinDataForParty.path,
        { params: { ...baseQuery(p), CKII: p.ckii } },
      );
      return res?.projectChecklistThirdPartyInspData ?? null;
    },
  });
}

/**
 * 为某检查项上传图片(multipart)。
 * request(JSON): WrapperProjectPartyDocsInspection,checklistItemIdCommaSeperated 设为该检查项 ID;
 * files: 选中的图片(同名字段 `files`)。后端按该 ID 关联图片并标记 isImageUploadedByParty。
 */
export function useUploadInspectionImages(p: PartyParams) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      checklistItemId,
      files,
    }: {
      checklistItemId: number;
      files: File[];
    }) => {
      const request: WrapperProjectPartyDocsInspection = {
        ...baseWrapper(p),
        checklistItemIdCommaSeperated: String(checklistItemId),
      };
      const fd = new FormData();
      fd.append('request', JSON.stringify(request));
      for (const f of files) fd.append('files', f);

      const res = await getApiClient().postForm<RequestResponse>(
        endpoints.partyDoc.uploadChecklistItemImageInspectinDataFromParty.path,
        fd,
      );
      if (res && res.success === false) {
        throw new Error(res.message || 'Opplasting feilet');
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deviationKeys.data(p) });
    },
  });
}
