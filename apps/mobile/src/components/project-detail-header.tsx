import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** 项目详情 Tabs 顶栏返回按钮 → 项目列表。 */
export function ProjectDetailHeaderBack() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        router.replace('/(app)/projects');
      }}
      className="ml-1 h-10 w-10 items-center justify-center active:opacity-60"
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Tilbake til prosjekter"
    >
      <Ionicons name="arrow-back" size={24} color="#404040" />
    </Pressable>
  );
}
