/**
 * 项目负责人 API —— WF7 påminnelse / WF8 kommende kontroll。
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type {
  WrapperProjectContactCustomerDto,
  WrapperProjectLeaderDto,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

import { workflowKeys } from './workflow-api';

export const projectLeaderKeys = {
  leader: (projectId: number) =>
    [...workflowKeys.all, 'project-leader', projectId] as const,
  reminder: (projectId: number) =>
    [...workflowKeys.all, 'reminder-date', projectId] as const,
};

export function useProjectLeader(projectId: number) {
  return useQuery({
    queryKey: projectLeaderKeys.leader(projectId),
    queryFn: async () => {
      const res = await getApiClient().get<WrapperProjectLeaderDto>(
        endpoints.project.getProjectLeaderByProjectId.path,
        { params: { ProjectID: projectId } },
      );
      return res?.projectLeader ?? null;
    },
    enabled: Number.isFinite(projectId) && projectId > 0,
  });
}

export function useReminderDate(projectId: number) {
  return useQuery({
    queryKey: projectLeaderKeys.reminder(projectId),
    queryFn: async () => {
      const res = await getApiClient().get<WrapperProjectContactCustomerDto>(
        endpoints.project.getContactCustomerReminderDate.path,
        { params: { ProjectID: projectId } },
      );
      return res?.contactCustomer ?? null;
    },
    enabled: Number.isFinite(projectId) && projectId > 0,
  });
}

export function useAssociateProjectLeader(projectId: number) {
  const { t } = useTranslation();
  return useApiMutation<WrapperProjectLeaderDto, number>({
    mutationFn: async (projectLeaderID) => {
      return getApiClient().post<WrapperProjectLeaderDto>(
        endpoints.project.associateProjectLeader.path,
        {
          projectLeader: {
            projectId,
            projectLeaderID,
          },
        },
      );
    },
    invalidateKeys: [projectLeaderKeys.leader(projectId)],
    successMessage: t('workflow.leader.toast.saved'),
    errorMessage: false,
  });
}
