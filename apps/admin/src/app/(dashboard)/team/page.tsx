'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTable } from '@/features/team/users-table';
import { MyProfile } from '@/features/team/my-profile';
import { CompanySettings } from '@/features/team/company-settings';

export default function TeamPage() {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t('team.title')}</h2>
        <p className="text-muted-foreground">{t('team.subtitle')}</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="users">{t('team.tabs.users')}</TabsTrigger>
            <TabsTrigger value="profile">{t('team.tabs.profile')}</TabsTrigger>
            <TabsTrigger value="company">{t('team.tabs.company')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {t('team.users.newUser')}
            </Button>
          </div>
          <UsersTable createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
        </TabsContent>

        <TabsContent value="profile">
          <MyProfile />
        </TabsContent>

        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
