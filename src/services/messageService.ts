import { prisma } from '@/lib/prisma';

export class MessageService {
  /**
   * Send a private message to a friend
   */
  static async sendMessage(senderId: string, receiverId: string, content: string, isAIGenerated = false) {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty.');
    }

    return await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content.trim(),
        model: isAIGenerated ? 'ai-generated' : undefined,
      },
    });
  }

  /**
   * Fetch conversation history between two users
   */
  static async getConversation(userId: string, friendId: string) {
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
   * Edit a message by its ID, ensuring the sender is the one editing it
   */
  static async editMessage(messageId: string, senderId: string, content: string) {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty.');
    }

    return await prisma.message.updateMany({
      where: {
        id: messageId,
        senderId,
      },
      data: {
        content: content.trim(),
        isEdited: true,
      },
    });
  }
}
