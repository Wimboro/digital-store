import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    server: {
        port: 4173,
        open: true,
        allowedHosts: ["demo.hiddencyber.qzz.io"]
    },
    build: {
        outDir: "dist"
    }
});
