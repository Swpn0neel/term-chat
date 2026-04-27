import { prisma } from '@/lib/prisma';
import { Status, TransferStatus } from '@/generated/client';

export class AppService {
  /**
   * Consolidates all necessary polling into a single Prisma transaction.
   * Fetches global state (unread counts, heartbeats) and screen-specific state.
   */
  static async pollState(userId: string, screen: string, params: Record<string, string>) {
    // 1. Fire-and-forget heartbeat
    prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date(), isOnline: true }
    }).catch(() => null);

    // Prepare global queries
    const dmUnreadPromise = prisma.message.groupBy({
      by: ['senderId'],
      where: { 
        receiverId: userId, 
        isRead: false,
        isAIChat: false
      },
      _count: { id: true }
    });

    const pendingCountPromise = prisma.friendRequest.count({
      where: { receiverId: userId, status: Status.PENDING }
    });

    const fileTransferCountPromise = prisma.fileTransfer.count({
      where: { receiverId: userId, status: TransferStatus.PENDING }
    });

    const userThemePromise = prisma.user.findUnique({
      where: { id: userId },
      select: { theme: true }
    });

    // Sub-query: Groups unread count (needs memberships first)
    const groupsUnreadTask = (async () => {
      const memberships = await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true, lastReadAt: true }
      });
      
      const counts = await Promise.all(memberships.map(async (m) => {
        const count = await prisma.message.count({
          where: {
            groupId: m.groupId,
            createdAt: { gt: m.lastReadAt },
            senderId: { not: userId },
            isAIChat: false
          }
        });
        return { groupId: m.groupId, count };
      }));
      
      return counts;
    })();

    // Prepare screen-specific queries
    let screenPromises: any = [];
    // ... (rest of screenPromises setup remains same)

    if (screen === 'chat' && params.friendId) {
      const friendId = params.friendId;
      screenPromises = [
        prisma.user.findUnique({
          where: { id: friendId },
          select: { username: true, isOnline: true, lastSeen: true }
        }),
        prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: friendId, status: Status.ACCEPTED },
              { senderId: friendId, receiverId: userId, status: Status.ACCEPTED }
            ]
          }
        }),
        prisma.message.findMany({
          where: {
            OR: [
              { senderId: userId, receiverId: friendId },
              { senderId: friendId, receiverId: userId }
            ]
          },
          orderBy: { createdAt: 'desc' }, // Fetch latest
          take: 100, // Limit for performance
          include: { sender: { select: { username: true } } }
        })
      ];
    } else if (screen === 'group-chat' && params.groupId) {
      const groupId = params.groupId;
      screenPromises = [
        prisma.group.findUnique({
          where: { id: groupId },
          include: {
            members: {
              include: { user: { select: { id: true, username: true, isOnline: true, lastSeen: true } } }
            },
            creator: { select: { id: true, username: true } }
          }
        }),
        prisma.message.findMany({
          where: { groupId },
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: { sender: { select: { username: true } } }
        })
      ];
    } else if (screen === 'friend-list') {
      screenPromises = [
        prisma.friendRequest.findMany({
          where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
            status: Status.ACCEPTED
          },
          include: {
            sender: { select: { id: true, username: true, isOnline: true, lastSeen: true } },
            receiver: { select: { id: true, username: true, isOnline: true, lastSeen: true } }
          }
        })
      ];
    } else if (screen === 'group-list') {
      screenPromises = [
        prisma.group.findMany({
          where: { members: { some: { userId } } },
          include: {
            members: { include: { user: { select: { isOnline: true, lastSeen: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
            _count: { select: { messages: true } }
          }
        })
      ];
    } else if (screen === 'pending') {
      screenPromises = [
        prisma.friendRequest.findMany({
          where: { receiverId: userId, status: Status.PENDING },
          include: { sender: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' }
        })
      ];
    } else if (screen === 'inbox') {
      screenPromises = [
        prisma.fileTransfer.findMany({
          where: { receiverId: userId, status: TransferStatus.PENDING },
          include: { sender: { select: { username: true } } },
          orderBy: { createdAt: 'desc' }
        })
      ];
    }

    // Execute everything concurrently
    const [
      dmUnreadRaw,
      pendingCount,
      fileTransferCount,
      groupUnreadsRaw,
      userThemePromiseResult,
      screenResults
    ] = await Promise.all([
      dmUnreadPromise,
      pendingCountPromise,
      fileTransferCountPromise,
      groupsUnreadTask,
      userThemePromise,
      Promise.all(screenPromises)
    ]);

    // Format global results
    const unreadCounts: Record<string, number> = {};
    for (const item of dmUnreadRaw) {
      unreadCounts[item.senderId] = (item._count as any).id;
    }

    const groupUnreadCounts: Record<string, number> = {};
    let totalGroupUnread = 0;
    for (const item of groupUnreadsRaw) {
      if (item.count > 0) {
        groupUnreadCounts[item.groupId] = item.count;
        totalGroupUnread += item.count;
      }
    }

    // Format screen-specific results
    let screenData: any = {};
    if (screen === 'chat') {
      screenData = { 
        friend: screenResults[0], 
        friendship: screenResults[1], 
        conversation: (screenResults[2] || []).reverse() // Back to chronological order
      };
    } else if (screen === 'group-chat') {
      screenData = { 
        groupDetails: screenResults[0], 
        messages: (screenResults[1] || []).reverse() 
      };
    } else if (screen === 'friend-list') {
      const acceptedRequests = screenResults[0];
      const friends = await Promise.all(acceptedRequests.map(async (req: any) => {
        const friend = req.senderId === userId ? req.receiver : req.sender;
        // Fetch last activity for sorting
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
        return { ...friend, lastActivity: lastMsg?.createdAt || new Date(0) };
      }));

      friends.sort((a: any, b: any) => {
        // First priority: Online status
        const aDiffMs = Date.now() - new Date(a.lastSeen).getTime();
        const bDiffMs = Date.now() - new Date(b.lastSeen).getTime();
        const aOnline = a.isOnline && Math.abs(aDiffMs) < 45000;
        const bOnline = b.isOnline && Math.abs(bDiffMs) < 45000;
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        
        // Second priority: Last activity
        return b.lastActivity.getTime() - a.lastActivity.getTime();
      });
      screenData = { friends };
    } else if (screen === 'inbox') {
      screenData = { transfers: screenResults[0] };
    } else if (screen === 'group-list') {
      const groups = screenResults[0];
      groups.sort((a: any, b: any) => {
        const aTime = a.messages[0]?.createdAt.getTime() || a.createdAt.getTime();
        const bTime = b.messages[0]?.createdAt.getTime() || b.createdAt.getTime();
        return bTime - aTime;
      });
      screenData = { groups };
    } else if (screen === 'pending') {
      screenData = { requests: screenResults[0] };
    }

    return {
      global: {
        unreadCounts,
        pendingCount,
        groupUnreadCounts,
        totalGroupUnread,
        fileTransferCount,
        theme: (userThemePromiseResult as any)?.theme || 'dracula'
      },
      screenData
    };
  }

  /**
   * Update the user's theme preference in the database.
   */
  static async updateUserTheme(userId: string, theme: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { theme }
    });
    // Also save to local session for persistence on startup
    const { SessionService } = await import('./sessionService');
    SessionService.saveSession(userId, theme);
  }
}
