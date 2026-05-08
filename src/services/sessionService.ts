import fs from 'fs';
import path from 'path';

const SESSION_DIR = path.join(process.cwd(), '.sessions');

function getSessionFile(userId: string): string {
  return path.join(SESSION_DIR, `${userId}.json`);
}

export class SessionService {
  /**
   * Save the current user session to a user-specific local file.
   * The private key is preserved even across sign-outs.
   */
  static saveSession(userId: string, themeName?: string, privateKey?: string) {
    try {
      if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
      }
      const sessionFile = getSessionFile(userId);
      // Preserve existing data (especially privateKey) unless explicitly overriding
      const current = this.getSessionByUserId(userId) || {};
      const data: any = { ...current, userId, loggedIn: true };
      if (themeName) data.themeName = themeName;
      if (privateKey) data.privateKey = privateKey;
      fs.writeFileSync(sessionFile, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  }

  /**
   * Get the session for a specific userId (always reads from the user's own file).
   */
  static getSessionByUserId(userId: string): { userId: string; themeName?: string; privateKey?: string; loggedIn?: boolean } | null {
    try {
      const sessionFile = getSessionFile(userId);
      if (fs.existsSync(sessionFile)) {
        return JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      }
    } catch (err) {}
    return null;
  }

  /**
   * Get the currently active (logged-in) session.
   * Returns the session file that has loggedIn: true, or the most recently modified one.
   * This is used for auto-login on app start.
   */
  static getSession(): { userId: string; themeName?: string; privateKey?: string; loggedIn?: boolean } | null {
    try {
      if (fs.existsSync(SESSION_DIR)) {
        const files = fs.readdirSync(SESSION_DIR).filter(f => f.endsWith('.json'));
        for (const file of files) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, file), 'utf-8'));
            if (data.loggedIn === true && data.userId) {
              return data;
            }
          } catch {}
        }
      }

      // Legacy fallback: old single .session.json file
      const legacyFile = path.join(process.cwd(), '.session.json');
      if (fs.existsSync(legacyFile)) {
        const data = JSON.parse(fs.readFileSync(legacyFile, 'utf-8'));
        return data;
      }
    } catch (err) {}
    return null;
  }

  /**
   * Sign out: mark the session as logged out but KEEP the private key.
   * This allows the user to re-login without losing their encryption keys.
   */
  static clearSession(userId?: string) {
    try {
      if (userId) {
        const sessionFile = getSessionFile(userId);
        if (fs.existsSync(sessionFile)) {
          const data = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
          // Mark as logged out but preserve private key for future decryption
          data.loggedIn = false;
          fs.writeFileSync(sessionFile, JSON.stringify(data));
        }
      } else {
        // Legacy: delete old single-file session
        const legacyFile = path.join(process.cwd(), '.session.json');
        if (fs.existsSync(legacyFile)) {
          fs.unlinkSync(legacyFile);
        }
      }
    } catch (err) {}
  }
}
