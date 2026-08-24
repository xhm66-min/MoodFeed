// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 从 package.json 读取项目名，让配置更通用
import { readFileSync } from 'fs'
import { join } from 'path'
const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'))
const repoName = packageJson.name

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 关键配置：根据环境变量设置资源根路径[reference:0]
  base: process.env.GITHUB_PAGES === 'true' ? `/${repoName}/` : '/',
})