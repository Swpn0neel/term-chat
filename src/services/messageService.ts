import { prisma } from '@/lib/prisma';
import { CryptoService } from '@/lib/crypto';
import { SessionService } from '@/services/sessionService';

export class MessageService {
  /**
   * Send a private message to a friend
   */
  static async sendMessage(senderId: string, receiverId: string, content: string, isAIGenerated = false) {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty.');
    }

    const recipient = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { publicKey: true }
    });

    const session = SessionService.getSessionByUserId(senderId);
    const privateKey = session?.privateKey;

    let finalContent = content.trim();
    let nonce: string | undefined;
    let isEncrypted = false;

    if (recipient?.publicKey && privateKey) {
      const encrypted = CryptoService.encrypt(finalContent, recipient.publicKey, privateKey);
      finalContent = encrypted.ciphertext;
      nonce = encrypted.nonce;
      isEncrypted = true;
    }

    return await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: finalContent,
        isEncrypted,
        nonce,
        model: isAIGenerated ? 'ai-generated' : undefined,
      },
    });
  }

  /**
   * Fetch conversation history between two users
   */
  static async getConversation(userId: string, friendId: string) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: { username: true, publicKey: true },
        },
        receiver: {
          select: { publicKey: true }
        }
      },
    });

    const session = SessionService.getSessionByUserId(userId);
    const privateKey = session?.privateKey;

    if (!privateKey) return messages;

    return messages.map(msg => {
      if (msg.isEncrypted && msg.nonce) {
        try {
          // Identify the peer's public key
          const peer = msg.senderId === userId ? msg.receiver : msg.sender;
          if (!peer?.publicKey) return msg;

          return {
            ...msg,
            content: CryptoService.decrypt(msg.content, msg.nonce, peer.publicKey, privateKey)
          };
        } catch (err: any) {
          return {
            ...msg,
            content: `[Decryption Failed: ${err.message}]`
          };
        }
      }
      return msg;
    });
  }

  /**
   * Delete a message by its ID, ensuring the sender is the one deleting it
   */
  static async deleteMessage(messageId: string, senderId: string) {
    return await prisma.message.deleteMany({
      where: {
        id: messageId,
        senderId,
      },
    });
  }

  /**
   * Delete all messages sent by a user in a specific conversation
   */
  static async deleteConversationMessages(senderId: string, receiverId: string) {
    return await prisma.message.deleteMany({
      where: {
        senderId,
        receiverId,
      },
    });
  }

  /**
   * Delete all messages sent by a user in a specific group
   */
  static async deleteGroupMessages(senderId: string, groupId: string) {
    return await prisma.message.deleteMany({
      where: {
        senderId,
        groupId,
      },
    });
  }

  /**
   * Send a message to a group
   */
  static async sendGroupMessage(senderId: string, groupId: string, content: string, isAIGenerated = false) {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty.');
    }

    // Check membership
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: senderId } }
    });
    if (!member) throw new Error('You are not a member of this group.');

    const msg = await prisma.message.create({
      data: {
        senderId,
        groupId,
        content: content.trim(),
        model: isAIGenerated ? 'ai-generated' : undefined,
      },
    });

    // Update group's updatedAt to sort active groups to the top
    await prisma.group.update({
      where: { id: groupId },
      data: { updatedAt: new Date() }
    });

    return msg;
  }

  /**
   * Fetch conversation history for a group
   */
  static async getGroupConversation(groupId: string, userId: string) {
    // Check membership
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });
    if (!member) throw new Error('You are not a member of this group.');

    return await prisma.message.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { username: true },
        },
      },
    });
  }
  /**
   * Edit a message by its ID, ensuring the sender is the one editing it.
   * Re-encrypts the new content if the message was originally encrypted.
   */
  static async editMessage(messageId: string, senderId: string, content: string) {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty.');
    }

    // Fetch the original message to check if it was encrypted
    const original = await prisma.message.findFirst({
      where: { id: messageId, senderId },
      include: {
        receiver: { select: { publicKey: true } }
      }
    });

    if (!original) {
      throw new Error('Message not found or you do not have permission to edit it.');
    }

    let finalContent = content.trim();
    let newNonce: string | undefined = undefined;

    if (original.isEncrypted && original.receiverId) {
      const session = SessionService.getSessionByUserId(senderId);
      const privateKey = session?.privateKey;
      const recipientPublicKey = original.receiver?.publicKey;

      if (privateKey && recipientPublicKey) {
        const encrypted = CryptoService.encrypt(finalContent, recipientPublicKey, privateKey);
        finalContent = encrypted.ciphertext;
        newNonce = encrypted.nonce;
      }
    }

    return await prisma.message.updateMany({
      where: { id: messageId, senderId },
      data: {
        content: finalContent,
        ...(newNonce ? { nonce: newNonce } : {}),
        isEdited: true,
      },
    });
  }
}
