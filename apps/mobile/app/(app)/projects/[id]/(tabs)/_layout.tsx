/**
 * 项目详情底部 Tabs:Info / Utvendig / Plantegning / Sjekklister / Klar。
 */
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ProjectDetailHeaderBack } from '@/components/project-detail-header';

export default function ProjectTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#737373',
        headerShown: true,
        headerLeft: () => <ProjectDetailHeaderBack />,
        headerTitleStyle: { fontWeight: '600' },
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
    </Tabs>
  );
}
