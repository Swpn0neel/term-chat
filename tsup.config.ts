import { defineConfig } from 'tsup';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  splitting: false,
  noExternal: [/^..\/src\/generated\/client/],
  external: ['path', 'fs', 'os', 'util', 'stream', 'events', 'http', 'https', 'zlib', 'url', 'crypto', 'readline', 'pg-native'],
  dts: true,
  clean: true,
  shims: true,
  banner: {
    js: `#!/usr/bin/env node\nimport { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  define: {
    'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  },
});
