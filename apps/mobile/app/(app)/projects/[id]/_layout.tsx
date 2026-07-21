/**
 * 项目详情壳:Stack。
 *  - (tabs):底部五 Tab
 *  - checklist/[checklistId]:全屏清单填写(不在 Tab 栏)
 */
import { Stack } from 'expo-router';

import { useOnlineResync } from '@/features/active-project/hooks';

export default function ProjectDetailLayout() {
  useOnlineResync();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="checklist/[checklistId]"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
