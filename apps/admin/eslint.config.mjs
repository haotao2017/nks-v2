import next from 'eslint-config-next';

// Next.js 16 的 eslint-config-next 直接导出扁平配置数组(含 core-web-vitals + typescript),
// 不再需要 @eslint/eslintrc 的 FlatCompat 兼容层。
const eslintConfig = [
  ...next,
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
