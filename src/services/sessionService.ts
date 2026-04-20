import fs from 'fs';
import path from 'path';

const SESSION_FILE = path.join(process.cwd(), '.session.json');

export class SessionService {
  /**
   * Save the current user session to a local file
   */
  static saveSession(userId: string) {
    try {
      fs.writeFileSync(SESSION_FILE, JSON.stringify({ userId }));
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  }

  /**
   * Get the saved user session from the local file
   */
  static getSession(): string | null {
    try {
      if (fs.existsSync(SESSION_FILE)) {
        const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
        return data.userId || null;
      }
    } catch (err) {
      // If parsing fails, the session is likely corrupt, so just return null
    }
    return null;
  }

  /**
   * Clear the saved user session
   */
  static clearSession() {
    try {
      if (fs.existsSync(SESSION_FILE)) {
        fs.unlinkSync(SESSION_FILE);
      }
    } catch (err) {}
  }
}
