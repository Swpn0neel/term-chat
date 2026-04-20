import { defineConfig } from 'tsup';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  dts: true,
  clean: true,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  },
});
