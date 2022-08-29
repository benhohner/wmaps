/// <reference types="vitest" />
import { mergeConfig } from "vite";
import { defineConfig } from "vite";
import { defineConfig as dc } from "vitest/config";
import react from "@vitejs/plugin-react";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
// https://vitejs.dev/config/

const testConfig = dc({
  test: {
    api: 5173,
  },
});

export default mergeConfig(
  testConfig,
  defineConfig({
    plugins: [
      react(),
      monacoEditorPlugin({
        languageWorkers: ["editorWorkerService", "typescript"],
      }),
    ],
  })
);
