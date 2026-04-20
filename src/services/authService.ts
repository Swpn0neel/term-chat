import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { SessionService } from './sessionService';

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
    SessionService.saveSession(user.id);
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
    SessionService.saveSession(user.id);

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
   * Update heartbeat timestamp
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
}
