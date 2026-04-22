import { prisma } from '../lib/prisma';

export class MessageService {
  /**
   * Send a private message to a friend
   */
  static async sendMessage(senderId: string, receiverId: string, content: string) {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty.');
    }

    return await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content.trim(),
      },
    });
  }

  /**
   * Fetch conversation history between two users
   */
  static async getConversation(userId: string, friendId: string, limit = 50) {
    return await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      include: {
        sender: {
          select: { username: true },
        },
      },
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
}
