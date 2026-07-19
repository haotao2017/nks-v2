'use client';

/**
 * ProjectLeaderSection —— 选联系人并保存为项目负责人(旧 Wf1S8/S9 SelectContact + Add)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ContactSelect } from '@/features/projects/wizard/contact-select';

import {
  useAssociateProjectLeader,
  useProjectLeader,
} from './project-leader-api';

export function ProjectLeaderSection({
  projectId,
  disabled,
}: {
  projectId: number;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const leaderQuery = useProjectLeader(projectId);
  const saveMut = useAssociateProjectLeader(projectId);
  const [contactId, setContactId] = React.useState('');

  React.useEffect(() => {
    const id = leaderQuery.data?.projectLeaderID;
    if (id != null) setContactId(String(id));
  }, [leaderQuery.data?.projectLeaderID]);

  function handleSave() {
    const id = Number(contactId);
    if (!Number.isFinite(id) || id <= 0) return;
    saveMut.mutate(id);
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <Label>{t('workflow.leader.label')}</Label>
      {leaderQuery.isPending ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t('workflow.leader.loading')}
        </div>
      ) : (
        <ContactSelect value={contactId} onChange={setContactId} />
      )}
      <Button
        type="button"
        size="sm"
        disabled={disabled || !contactId || saveMut.isPending}
        onClick={handleSave}
      >
        {saveMut.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {t('workflow.leader.save')}
      </Button>
    </div>
  );
}
