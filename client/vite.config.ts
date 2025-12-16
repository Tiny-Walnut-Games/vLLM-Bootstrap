import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { ServerOptions } from 'https';

const getHttpsConfig = (): ServerOptions | false => {
  const keyPath = join(process.cwd(), '..', 'server', '.ssl', 'server.key');
  const certPath = join(process.cwd(), '..', 'server', '.ssl', 'server.crt');

  if (existsSync(keyPath) && existsSync(certPath)) {
    return {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath)
    } as ServerOptions;
  }
  return false;
};

const httpsConfig = getHttpsConfig();

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    ...(httpsConfig ? { https: httpsConfig } : {}),
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'wss://127.0.0.1:3001',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
