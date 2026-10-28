import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 主题项目共用的 Vite 配置；构建输出留在各项目自己的 dist/。
export default defineConfig({ plugins: [react()] });
