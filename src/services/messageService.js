import { prisma } from '../lib/prisma';
export class MessageService {
    /**
     * Send a private message to a friend
     */
    static async sendMessage(senderId, receiverId, content) {
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
    static async getConversation(userId, friendId, limit = 50) {
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
}
