import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => ({
  // 生产构建用相对路径，兼容 GitHub Pages 的子路径部署
  base: command === 'build' ? './' : '/',
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
  },
}))
