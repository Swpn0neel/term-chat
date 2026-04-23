import { AuthService } from '@/services/authService';
import { prisma } from '@/lib/prisma';

export async function shutdown(userId: string | null) {
  try {
    if (userId) {
      // Mark user offline in DB before closing
      await AuthService.setOffline(userId);
    }
    await prisma.$disconnect();
  } catch (err) {
    // Silent catch if already disconnected
  } finally {
    process.exit(0);
  }
}
