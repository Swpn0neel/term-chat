import { prisma } from '../lib/prisma';
import pkg_prisma from '../generated/client';
const { Status } = pkg_prisma;

export class SocialService {
  /**
   * Send a friend request to a target username
   */
  static async sendRequest(senderId: string, targetUsername: string) {
    const receiver = await prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!receiver) {
      throw new Error('User not found.');
    }

    if (receiver.id === senderId) {
      throw new Error('You cannot add yourself.');
    }

    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === Status.ACCEPTED) {
        throw new Error('You are already friends.');
      }
      if (existing.status === Status.PENDING) {
        throw new Error('A friend request is already pending.');
      }
    }

    return await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId: receiver.id,
        status: Status.PENDING,
      },
    });
  }

  /**
   * Fetch pending requests for a user
   */
  static async getPendingRequests(userId: string) {
    return await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: Status.PENDING,
      },
      include: {
        sender: {
          select: { id: true, username: true },
        },
      },
    });
  }

  /**
   * Fetch pending requests count for a user
   */
  static async getPendingCount(userId: string) {
    return await prisma.friendRequest.count({
      where: {
        receiverId: userId,
        status: Status.PENDING,
      },
    });
  }

  /**
   * Accept or Decline a request
   */
  static async respondToRequest(requestId: string, action: 'ACCEPT' | 'DECLINE') {
    if (action === 'ACCEPT') {
      return await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: Status.ACCEPTED },
      });
    } else {
      return await prisma.friendRequest.delete({
        where: { id: requestId },
      });
    }
  }

  /**
   * Accept or Decline multiple requests
   */
  static async respondToMultipleRequests(requestIds: string[], action: 'ACCEPT' | 'DECLINE') {
    if (action === 'ACCEPT') {
      return await prisma.friendRequest.updateMany({
        where: { id: { in: requestIds } },
        data: { status: Status.ACCEPTED },
      });
    } else {
      return await prisma.friendRequest.deleteMany({
        where: { id: { in: requestIds } },
      });
    }
  }

  /**
   * Check if two users are friends
   */
  static async getFriendship(userId: string, targetId: string) {
    return await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetId, status: Status.ACCEPTED },
          { senderId: targetId, receiverId: userId, status: Status.ACCEPTED },
        ],
      },
    });
  }

  /**
   * Remove multiple friends
   */
  static async removeFriends(userId: string, friendIds: string[]) {
    return await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: friendIds }, status: Status.ACCEPTED },
          { senderId: { in: friendIds }, receiverId: userId, status: Status.ACCEPTED },
        ],
      },
    });
  }

  /**
   * Fetch all mutual friends
   */
  static async getFriendList(userId: string) {
    const friendships = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: Status.ACCEPTED },
          { receiverId: userId, status: Status.ACCEPTED },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, isOnline: true, lastSeen: true } },
        receiver: { select: { id: true, username: true, isOnline: true, lastSeen: true } },
      },
    });

    const friends = friendships.map(f => {
      return f.senderId === userId ? f.receiver : f.sender;
    });

    // Get the last message timestamp for each friend to enable activity-based sorting
    const friendsWithActivity = await Promise.all(
      friends.map(async friend => {
        const lastMsg = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: friend.id },
              { senderId: friend.id, receiverId: userId }
            ],
            isAIChat: false
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });
        return {
          ...friend,
          lastActivity: lastMsg?.createdAt || new Date(0)
        };
      })
    );

    // Sort by last activity (most recent first)
    return friendsWithActivity
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Get counts of unread messages per friend
   */
  static async getUnreadCounts(userId: string) {
    const unreadMessages = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        isRead: false,
        isAIChat: false
      },
      _count: {
        id: true
      }
    });

    const counts: Record<string, number> = {};
    unreadMessages.forEach(group => {
      counts[group.senderId] = group._count.id;
    });

    return counts;
  }

  /**
   * Mark all messages from a friend as read
   */
  static async markAsRead(userId: string, friendId: string) {
    await prisma.message.updateMany({
      where: {
        senderId: friendId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }
}
