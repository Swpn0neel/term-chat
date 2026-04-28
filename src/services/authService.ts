import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SessionService } from '@/services/sessionService';

export class AuthService {
  /**
   * Get user by ID for session restoration
   */
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    
    // Explicitly ensure user is marked online if we are restoring their session
    await prisma.user.update({
      where: { id },
      data: { 
        isOnline: true,
        lastSeen: new Date()
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Create a new user with a hashed password
   */
  static async signUp(username: string, password: string) {
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      throw new Error('Username is already taken.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isOnline: true,
        lastSeen: new Date()
      },
    });

    // Save session locally
    SessionService.saveSession(user.id, user.theme || undefined);
    return user;
  }

  /**
   * Authenticate a user and return the user object (without password)
   */
  static async signIn(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials.');
    }

    // Update online status in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isOnline: true, 
        lastSeen: new Date()
      }
    });

    // Save session locally
    SessionService.saveSession(user.id, user.theme || undefined);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Mark user as offline
   */
  static async setOffline(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false }
      });
    } catch (err) {}
  }

  /**
   * Update user heartbeat timestamp
   */
  static async updateHeartbeat(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isOnline: true, // Ensure they are online
          lastSeen: new Date() 
        }
      });
    } catch (err) {}
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Incorrect current password.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });
  }

  /**
   * Update user bio details
   */
  static async updateBio(userId: string, data: { fullName?: string, about?: string, birthday?: Date | null }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        about: data.about,
        birthday: data.birthday
      }
    });
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by username for bio info
   */
  static async getUserByUsername(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        about: true,
        birthday: true
      }
    });
    return user;
  }
}
