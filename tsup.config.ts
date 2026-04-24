import { defineConfig } from 'tsup';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  splitting: false,
  noExternal: [/^..\/src\/generated\/client/, 'archiver', 'archiver-utils', 'glob'],
  external: ['path', 'fs', 'os', 'util', 'stream', 'events', 'http', 'https', 'zlib', 'url', 'crypto', 'readline', 'pg-native'],
  dts: true,
  clean: true,
  shims: true,
  banner: {
    js: `#!/usr/bin/env node\nimport { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  define: {
    'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    'process.env.R2_ACCOUNT_ID': JSON.stringify(process.env.R2_ACCOUNT_ID),
    'process.env.R2_ACCESS_KEY_ID': JSON.stringify(process.env.R2_ACCESS_KEY_ID),
    'process.env.R2_SECRET_ACCESS_KEY': JSON.stringify(process.env.R2_SECRET_ACCESS_KEY),
    'process.env.R2_BUCKET_NAME': JSON.stringify(process.env.R2_BUCKET_NAME),
    'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.6.1'),
  },
});
