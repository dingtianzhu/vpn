import { defineConfig } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: "electron/main.ts",
      },
      preload: {
        input: path.join(__dirname, "electron/preload.ts"),
        vite: {
          build: {
            rollupOptions: {
              output: {
                // ⚠️ 核心修改：强制输出为 CommonJS 格式的 .cjs 文件
                // 这能 100% 解决 "require is not defined" 的问题
                format: "cjs",
                entryFileNames: "preload.cjs",
                inlineDynamicImports: true,
              },
            },
          },
        },
      },
      renderer: process.env.NODE_ENV === "test" ? undefined : {},
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
});
