/**
 * 项目详情底部 Tabs 壳:Info / Utvendig / Plantegning / Sjekklister / Klar。
 * Info 与 Utvendig(外景拍照)已实现;其余为占位页,后续任务填充。
 * 挂 useOnlineResync:恢复联网时自动补传离线期间的本地改动。
 */
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useOnlineResync } from '@/features/active-project/hooks';

export default function ProjectDetailLayout() {
  useOnlineResync();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#737373',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Info',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exterior"
        options={{
          title: 'Utvendig',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plantegning"
        options={{
          title: 'Plantegning',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="checklists"
        options={{
          title: 'Sjekklister',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="klar"
        options={{
          title: 'Klar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 单清单填写:栈式全屏(不入 Tab 栏,隐藏底部 Tab,自绘顶栏返回)。 */}
      <Tabs.Screen
        name="checklist/[checklistId]"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
