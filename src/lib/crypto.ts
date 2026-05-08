import sodium from 'sodium-native';
import { pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

export class CryptoService {
  /**
   * Generate a new X25519 keypair for E2EE
   */
  static generateKeyPair() {
    const publicKey = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES);
    const privateKey = Buffer.alloc(sodium.crypto_box_SECRETKEYBYTES);
    sodium.crypto_box_keypair(publicKey, privateKey);
    return {
      publicKey: publicKey.toString('base64'),
      privateKey: privateKey.toString('base64'),
    };
  }

  /**
   * Derive public key from private key
   */
  static getPublicKey(privateKeyBase64: string) {
    const privateKey = Buffer.from(privateKeyBase64, 'base64');
    const publicKey = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES);
    sodium.crypto_scalarmult_base(publicKey, privateKey);
    return {
      publicKey: publicKey.toString('base64'),
    };
  }

  /**
   * Encrypt content for a recipient using their public key and my private key
   */
  static encrypt(content: string, recipientPublicKeyBase64: string, myPrivateKeyBase64: string) {
    const message = Buffer.from(content, 'utf8');
    const recipientPublicKey = Buffer.from(recipientPublicKeyBase64, 'base64');
    const myPrivateKey = Buffer.from(myPrivateKeyBase64, 'base64');
    
    const nonce = Buffer.alloc(sodium.crypto_box_NONCEBYTES);
    sodium.randombytes_buf(nonce);
    
    const ciphertext = Buffer.alloc(message.length + sodium.crypto_box_MACBYTES);
    sodium.crypto_box_easy(ciphertext, message, nonce, recipientPublicKey, myPrivateKey);
    
    return {
      ciphertext: ciphertext.toString('base64'),
      nonce: nonce.toString('base64'),
    };
  }

  /**
   * Decrypt content from a sender using my private key and their public key
   */
  static decrypt(ciphertextBase64: string, nonceBase64: string, senderPublicKeyBase64: string, myPrivateKeyBase64: string): string {
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');
    const nonce = Buffer.from(nonceBase64, 'base64');
    const senderPublicKey = Buffer.from(senderPublicKeyBase64, 'base64');
    const myPrivateKey = Buffer.from(myPrivateKeyBase64, 'base64');
    
    const message = Buffer.alloc(ciphertext.length - sodium.crypto_box_MACBYTES);
    const success = sodium.crypto_box_open_easy(message, ciphertext, nonce, senderPublicKey, myPrivateKey);
    
    if (!success) {
      throw new Error('Decryption failed. Invalid keys or corrupted data.');
    }
    
    return message.toString('utf8');
  }

  // ─── Key Vault (cross-device recovery) ───────────────────────────────────────

  /**
   * Derive a 256-bit vault key from a plaintext password using PBKDF2.
   * The salt must be stored per-user (vaultSalt column).
   */
  static deriveVaultKey(password: string, saltBase64: string): Buffer {
    const salt = Buffer.from(saltBase64, 'base64');
    return pbkdf2Sync(password, salt, 100_000, 32, 'sha256');
  }

  /**
   * Generate a random vaultSalt and encrypt the private key with the vault key.
   * Returns { encryptedVault, vaultSalt } — both base64-encoded — to store in DB.
   */
  static encryptVault(privateKeyBase64: string, password: string): { encryptedVault: string; vaultSalt: string } {
    const saltBytes = randomBytes(16);
    const vaultSalt = saltBytes.toString('base64');
    const vaultKey = this.deriveVaultKey(password, vaultSalt);

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', vaultKey, iv);
    const plaintext = Buffer.from(privateKeyBase64, 'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: iv(12B) + authTag(16B) + ciphertext — all concatenated then base64-encoded
    const encryptedVault = Buffer.concat([iv, authTag, encrypted]).toString('base64');
    return { encryptedVault, vaultSalt };
  }

  /**
   * Decrypt the vault using the password and stored salt.
   * Returns the private key in base64 format.
   */
  static decryptVault(encryptedVaultBase64: string, vaultSaltBase64: string, password: string): string {
    const vaultKey = this.deriveVaultKey(password, vaultSaltBase64);
    const raw = Buffer.from(encryptedVaultBase64, 'base64');

    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', vaultKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8'); // private key in base64
  }
}
