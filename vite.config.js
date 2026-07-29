import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
export default defineConfig({
    base: repoName ? `/${repoName}/` : "/",
    plugins: [react()],
    build: {
        target: "es2022",
        sourcemap: false
    },
    server: {
        host: "127.0.0.1",
        port: 5173,
        strictPort: false,
        watch: {
            ignored: ["**/work/**", "**/outputs/**"]
        }
    }
});
