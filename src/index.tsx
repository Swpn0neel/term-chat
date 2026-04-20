// Clear terminal for a clean startup
process.stdout.write('\x1Bc');

import { render } from 'ink';
import App from './App';
import { session } from './lib/session';
import { AuthService } from './services/authService';
import { prisma } from './lib/prisma';

render(<App />);

// Graceful Shutdown Logic
async function cleanup() {
  const userId = session.getUserId();
  if (userId) {
    await AuthService.setOffline(userId).catch(() => {});
  }
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  // Synchronous cleanup if possible, or background if not
  // (Mainly for Ctrl+C handling)
});
