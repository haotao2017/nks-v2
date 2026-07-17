/** Tab 占位页(后续任务填充)。 */
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export function TabPlaceholder({ title }: { title: string }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-lg font-semibold text-neutral-800">{title}</Text>
      <Text className="mt-2 text-sm text-neutral-400">Prosjekt #{id}</Text>
      <Text className="mt-4 text-center text-sm text-neutral-400">
        Kommer snart
      </Text>
    </View>
  );
}
