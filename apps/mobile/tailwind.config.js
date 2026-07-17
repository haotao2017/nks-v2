/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // NKS 品牌基调(简洁蓝),与 admin 心智一致
        brand: {
          DEFAULT: '#1d4ed8',
          fg: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};
