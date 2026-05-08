import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SessionService } from '@/services/sessionService';
import { CryptoService } from '@/lib/crypto';

export class AuthService {
  /**
   * Get user by ID for session restoration
   */
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    
    await prisma.user.update({
      where: { id },
      data: { isOnline: true, lastSeen: new Date() }
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Create a new user, generate E2EE keys, and create an encrypted vault.
   */
  static async signUp(username: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { username } });
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

    // Generate E2EE keypair
    const { publicKey, privateKey } = CryptoService.generateKeyPair();

    // Encrypt the private key into an encrypted vault using the user's password
    const { encryptedVault, vaultSalt } = CryptoService.encryptVault(privateKey, password);

    await prisma.user.update({
      where: { id: user.id },
      data: { publicKey, encryptedVault, vaultSalt }
    });

    // Cache locally for instant access
    SessionService.saveSession(user.id, user.theme || undefined, privateKey);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Authenticate a user.
   * Key resolution priority:
   *   1. Local session file (fast path — same machine, same keypair)
   *   2. Encrypted vault from DB (new device — decrypt with password)
   *   3. Generate fresh keypair (brand new account, no vault yet)
   */
  static async signIn(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      throw new Error('User not found.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() }
    });

    let resolvedPrivateKey: string | null = null;

    // ── 1. Try local session first (same device, fast path) ──────────────────
    const localSession = SessionService.getSessionByUserId(user.id);
    const localPrivateKey = localSession?.privateKey;

    if (localPrivateKey && user.publicKey) {
      try {
        const { publicKey: derivedPub } = CryptoService.getPublicKey(localPrivateKey);
        if (derivedPub === user.publicKey) {
          resolvedPrivateKey = localPrivateKey;
        }
      } catch {}
    }

    // ── 2. Try vault from DB (new device or local cache miss) ─────────────────
    if (!resolvedPrivateKey && user.encryptedVault && user.vaultSalt) {
      try {
        const privateKey = CryptoService.decryptVault(user.encryptedVault, user.vaultSalt, password);
        // Verify the decrypted key matches the public key on record
        const { publicKey: derivedPub } = CryptoService.getPublicKey(privateKey);
        if (derivedPub === user.publicKey) {
          resolvedPrivateKey = privateKey;
        }
      } catch {
        // Vault decryption failed (shouldn't happen with correct password)
      }
    }

    // ── 3. No usable key found — generate fresh keypair + new vault ───────────
    if (!resolvedPrivateKey) {
      const { publicKey, privateKey } = CryptoService.generateKeyPair();
      const { encryptedVault, vaultSalt } = CryptoService.encryptVault(privateKey, password);
      await prisma.user.update({
        where: { id: user.id },
        data: { publicKey, encryptedVault, vaultSalt }
      });
      resolvedPrivateKey = privateKey;
    }

    // Cache resolved key locally for subsequent fast-path access
    SessionService.saveSession(user.id, user.theme || undefined, resolvedPrivateKey);

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
        data: { isOnline: true, lastSeen: new Date() }
      });
    } catch (err) {}
  }

  /**
   * Change user password.
   * Also re-encrypts the vault with the new password so cross-device recovery
   * continues to work correctly after a password change.
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error('Incorrect current password.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Re-encrypt vault with the new password
    const localSession = SessionService.getSessionByUserId(userId);
    const privateKey = localSession?.privateKey;
    let vaultUpdate: { encryptedVault: string; vaultSalt: string } | undefined;

    if (privateKey) {
      vaultUpdate = CryptoService.encryptVault(privateKey, newPassword);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        ...(vaultUpdate ?? {})
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
