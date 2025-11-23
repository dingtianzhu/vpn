/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: [
    "./index.html",
    // 确保扫描 src 下所有文件
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 你的自定义颜色配置
      colors: {
        vpn: {
          bg: '#0f172a',
          panel: '#1e293b',
          primary: '#10b981',
          danger: '#ef4444',
          text: '#e2e8f0',
          muted: '#94a3b8',
        }
      }
    },
  },
  plugins: [],
}