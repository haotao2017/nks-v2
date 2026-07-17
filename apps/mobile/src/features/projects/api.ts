/**
 * 项目(移动端)数据访问层。
 *
 * 端点(endpoints.mobileApp.*):
 *  - useProjectList  GET /MobileApp/GetProjectList → ResponseContainer
 *                    { response, listOfProjects: Login[] },解包 listOfProjects。
 *
 * 契约说明(见任务报告):
 *  - 列表项在后端 dto/api 里类型名为 `Login`(命名怪但确为项目列表项),
 *    字段:projectID / projectName / projectDetail / inspectionDate(均 camelCase,
 *    projectID 的 ID 为大写)。旧客户端无 status/address 独立字段;卡片用
 *    projectName + projectDetail + inspectionDate 呈现。
 *  - 旧客户端调用 GetProjectList 不带任何参数(服务端按 token 归属返回)。
 */
import { useQuery } from '@tanstack/react-query';

import type { Login as MobileProjectListItem, ResponseContainer } from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';

export type { MobileProjectListItem };

export const projectKeys = {
  all: ['mobile-projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

/** 项目列表。解包 res.listOfProjects。 */
export function useProjectList() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const res = await getApiClient().get<ResponseContainer>(
        endpoints.mobileApp.getProjectList.path,
      );
      return res?.listOfProjects ?? [];
    },
  });
}
