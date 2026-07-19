'use client';

/**
 * Wf2StepOnePanel —— Workflow 2「UK lufttetthet」(旧 Wf2S1.js)。
 *
 * 字段:
 *  - tepmlateValue: UK lufttetthet(数字/文本)
 *  - avvik: Ja(1) / Nei(2)
 *  - avvikSendtKommune: Ja(1) / Nei(2)
 *
 * API: GetProjectWFTwoStepOne / UpdateProjectWFTwoStepOne
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2, Save } from 'lucide-react';

import type { ProjectWorkflowDto, RequestResponse, WrapperProjectWorkflowDto } from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiClient } from '@/lib/api';
import i18n from '@/lib/i18n';
import { useApiMutation } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';

import { workflowKeys } from './workflow-api';

const WF2_ID = 2;
const WF2_STEP_ID = 1;

function assertOk(res: RequestResponse | undefined): RequestResponse {
  const ok = res?.success ?? res?.isSuccess;
  if (ok === false) {
    throw new Error(res?.message || i18n.t('workflow.errors.actionFailed'));
  }
  return res ?? {};
}

function unwrap(res: unknown): ProjectWorkflowDto | undefined {
  if (!res || typeof res !== 'object') return undefined;
  const r = res as Record<string, unknown>;
  return (r.ProjectWorkflow ?? r.projectWorkflow) as ProjectWorkflowDto | undefined;
}

function useWf2StepOne(projectId: number) {
  return useQuery({
    queryKey: [...workflowKeys.all, 'wf2-step-one', projectId] as const,
    queryFn: async () => {
      const body: ProjectWorkflowDto = {
        projectId,
        workflowId: WF2_ID,
        workflowStepId: WF2_STEP_ID,
        isTransfer: false,
      };
      const res = await getApiClient().post<WrapperProjectWorkflowDto>(
        endpoints.projectWorkflow.getWFTwoStepOne.path,
        { ProjectWorkflow: body },
      );
      return unwrap(res);
    },
    enabled: Number.isFinite(projectId) && projectId > 0,
  });
}

function useSaveWf2StepOne(projectId: number) {
  const { t } = useTranslation();
  return useApiMutation<
    RequestResponse,
    { tepmlateValue: string; avvik: string; avvikSendtKommune: string }
  >({
    mutationFn: async (fields) => {
      const body: ProjectWorkflowDto = {
        projectId,
        workflowId: WF2_ID,
        workflowStepId: WF2_STEP_ID,
        isTransfer: false,
        tepmlateValue: fields.tepmlateValue,
        avvik: fields.avvik,
        avvikSendtKommune: fields.avvikSendtKommune,
      };
      const res = await getApiClient().put<RequestResponse>(
        endpoints.projectWorkflow.updateWFTwoStepOne.path,
        { ProjectWorkflow: body },
      );
      return assertOk(res);
    },
    invalidateKeys: [[...workflowKeys.all, 'wf2-step-one', projectId]],
    successMessage: t('workflow.wf2.toast.saved'),
    errorMessage: false,
  });
}

const YES_NO = [
  { value: '1', labelKey: 'workflow.wf2.yes' as const },
  { value: '2', labelKey: 'workflow.wf2.no' as const },
];

export function Wf2StepOnePanel({
  projectId,
  disabled,
}: {
  projectId: number;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const query = useWf2StepOne(projectId);
  const saveMut = useSaveWf2StepOne(projectId);

  const [tepmlateValue, setTepmlateValue] = React.useState('');
  const [avvik, setAvvik] = React.useState('2');
  const [avvikSendtKommune, setAvvikSendtKommune] = React.useState('2');

  React.useEffect(() => {
    if (!query.data) return;
    setTepmlateValue(query.data.tepmlateValue != null ? String(query.data.tepmlateValue) : '');
    setAvvik(query.data.avvik != null ? String(query.data.avvik) : '2');
    setAvvikSendtKommune(
      query.data.avvikSendtKommune != null ? String(query.data.avvikSendtKommune) : '2',
    );
  }, [query.data]);

  function handleSave() {
    saveMut.mutate({ tepmlateValue, avvik, avvikSendtKommune });
  }

  if (query.isPending) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t('workflow.wf2.loading')}
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="text-destructive flex items-center gap-2 text-sm">
        <AlertCircle className="size-4" />
        {t('workflow.wf2.loadError')}
      </p>
    );
  }

  return (
    <div className="max-w-md space-y-5">
      <p className="text-muted-foreground text-sm">{t('workflow.wf2.description')}</p>

      <div className="space-y-1.5">
        <Label htmlFor="wf2-lufttetthet">{t('workflow.wf2.lufttetthet')}</Label>
        <Input
          id="wf2-lufttetthet"
          type="number"
          step="any"
          value={tepmlateValue}
          onChange={(e) => setTepmlateValue(e.target.value)}
          disabled={disabled}
          required
        />
      </div>

      <fieldset className="space-y-2">
        <Label>{t('workflow.wf2.avvik')}</Label>
        <div className="flex gap-2">
          {YES_NO.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={avvik === opt.value ? 'default' : 'outline'}
              disabled={disabled}
              onClick={() => setAvvik(opt.value)}
            >
              {t(opt.labelKey)}
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <Label>{t('workflow.wf2.avvikSendtKommune')}</Label>
        <div className="flex gap-2">
          {YES_NO.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={avvikSendtKommune === opt.value ? 'default' : 'outline'}
              disabled={disabled}
              onClick={() => setAvvikSendtKommune(opt.value)}
            >
              {t(opt.labelKey)}
            </Button>
          ))}
        </div>
      </fieldset>

      <Button
        type="button"
        disabled={disabled || saveMut.isPending || !tepmlateValue.trim()}
        onClick={handleSave}
      >
        {saveMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {t('common.save')}
      </Button>
    </div>
  );
}
