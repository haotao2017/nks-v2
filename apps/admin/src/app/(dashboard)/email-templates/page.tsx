'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmailTemplatesTable } from '@/features/email-templates/email-templates-table';

export default function EmailTemplatesPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">E-postmaler</h2>
          <p className="text-muted-foreground">Administrer e-postmaler med variabler.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Ny e-postmal
        </Button>
      </div>

      <EmailTemplatesTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
