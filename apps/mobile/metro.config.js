/**
 * Metro —— pnpm monorepo + NativeWind v4。
 *
 * pnpm 关键点:
 *  - watchFolders 指向 monorepo 根,使 packages/* 的 TS 源码(经 node_modules
 *    symlink 暴露为 @nks/api-client、@nks/api-types)能被 Metro 监视与转译。
 *  - nodeModulesPaths 同时包含 app 本地与 monorepo 根的 node_modules,pnpm 的
 *    symlink(以及 .pnpm 虚拟 store)才能被正确解析。
 *  - Metro 0.80+ 默认支持 symlink,无需额外开关;这两个 workspace 包的 main 指向
 *    src/index.ts,Metro 用 babel-preset-expo 自动 strip TS 类型,无需额外 transpile 配置。
 *
 * NativeWind:用 withNativeWind 包裹,input 指向 global.css。
 */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 监视整个 monorepo(含 packages/* 源码与根 node_modules)
config.watchFolders = [monorepoRoot];

// 解析顺序:先 app 本地 node_modules,再 monorepo 根 node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
