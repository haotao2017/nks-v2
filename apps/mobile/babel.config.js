/**
 * Babel —— Expo SDK 57 + NativeWind v4 + Reanimated 4。
 *
 * - babel-preset-expo 的 jsxImportSource 指向 nativewind,使 className 生效。
 * - nativewind/babel 处理样式转译。
 * - react-native-worklets/plugin 是 Reanimated 4 的必备插件(替代旧的
 *   react-native-reanimated/plugin),且必须放在插件列表最后。
 * - expo-router 的 babel 处理已内置于 babel-preset-expo,无需单独插件。
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};
