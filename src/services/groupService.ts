import { prisma } from '@/lib/prisma';
import pkg_prisma from '@/generated/client';
import { getRandomColor, getNextColor } from '@/lib/groupColors';
const { GroupRole, MessageType } = pkg_prisma;

export class GroupService {
  /**
   * Create a new group with a name, creator, and initial members
   */
  static async createGroup(name: string, creatorId: string, memberIds: string[]) {
    const group = await prisma.group.create({
      data: {
        name,
        creatorId,
        members: {
          create: [
            { userId: creatorId, role: GroupRole.ADMIN, color: getRandomColor() },
            ...memberIds.map(id => ({ userId: id, role: GroupRole.MEMBER, color: getRandomColor() }))
          ]
        }
      }
    });

    const creator = await prisma.user.findUnique({ where: { id: creatorId }, select: { username: true } });
    
    // System message: "Creator created the group"
    await prisma.message.create({
      data: {
        senderId: creatorId,
        groupId: group.id,
        content: `${creator?.username} created the group "${name}"`,
        type: MessageType.SYSTEM
      }
    });

    // System messages for each member added
    for (const memberId of memberIds) {
      const user = await prisma.user.findUnique({ where: { id: memberId }, select: { username: true } });
      await prisma.message.create({
        data: {
          senderId: creatorId,
          groupId: group.id,
          content: `${user?.username} was added to the group`,
          type: MessageType.SYSTEM
        }
      });
    }

    // Touch group to update activity
    await prisma.group.update({ where: { id: group.id }, data: { updatedAt: new Date() } });

    return group;
  }

  /**
   * Fetch all groups the user is a member of
   */
  static async getGroupsForUser(userId: string) {
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: { isOnline: true, lastSeen: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    // Sort by actual last message activity (or creation time if no messages)
    return groups.sort((a, b) => {
      const aTime = a.messages[0]?.createdAt.getTime() || a.createdAt.getTime();
      const bTime = b.messages[0]?.createdAt.getTime() || b.createdAt.getTime();
      return bTime - aTime;
    });
  }

  /**
   * Fetch full details of a group, including members and their status
   */
  static async getGroupDetails(groupId: string) {
    return await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, isOnline: true, lastSeen: true }
            }
          }
        },
        creator: {
          select: { id: true, username: true }
        }
      }
    });
  }

  /**
   * Add a member to a group by their username
   */
  static async addMember(groupId: string, targetUsername: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { username: targetUsername } });
    if (!user) throw new Error('User not found');

    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { username: true } });

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } }
    });
    if (existing) throw new Error('User is already in the group');

    await prisma.groupMember.create({
      data: { groupId, userId: user.id, color: getRandomColor() }
    });

    await prisma.message.create({
      data: {
        senderId: adminId,
        groupId,
        content: `${user.username} was added to the group by ${admin?.username}`,
        type: MessageType.SYSTEM
      }
    });

    // Touch group to update activity
    await prisma.group.update({ where: { id: groupId }, data: { updatedAt: new Date() } });
  }

  /**
   * Remove a member from a group
   */
  static async removeMember(groupId: string, targetUsername: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { username: targetUsername } });
    if (!user) throw new Error('User not found');

    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { username: true } });

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: user.id } }
    });

    await prisma.message.create({
      data: {
        senderId: adminId,
        groupId,
        content: `${user.username} was removed from the group by ${admin?.username}`,
        type: MessageType.SYSTEM
      }
    });

    // Touch group to update activity
    await prisma.group.update({ where: { id: groupId }, data: { updatedAt: new Date() } });
  }

  /**
   * Leave a group and delete it if it's empty
   */
  static async leaveGroup(groupId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } }
    });

    await prisma.message.create({
      data: {
        senderId: userId,
        groupId,
        content: `${user?.username} left the group`,
        type: MessageType.SYSTEM
      }
    });

    // Touch group to update activity
    await prisma.group.update({ where: { id: groupId }, data: { updatedAt: new Date() } });

    const memberCount = await prisma.groupMember.count({ where: { groupId } });
    if (memberCount === 0) {
      await prisma.message.deleteMany({ where: { groupId } });
      await prisma.group.delete({ where: { id: groupId } });
    }
  }
  /**
   * Mark all messages in a group as read for a specific user
   */
  static async markAsRead(groupId: string, userId: string) {
    try {
      await prisma.groupMember.update({
        where: { groupId_userId: { groupId, userId } },
        data: { lastReadAt: new Date() }
      });
    } catch (err) {}
  }

  /**
   * Get count of groups with unread messages for a user
   */
  static async getUnreadCount(userId: string) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true, lastReadAt: true }
    });

    let groupsWithUnread = 0;
    for (const membership of memberships) {
      const count = await prisma.message.count({
        where: {
          groupId: membership.groupId,
          createdAt: { gt: membership.lastReadAt },
          senderId: { not: userId }
        }
      });
      if (count > 0) groupsWithUnread++;
    }
    return groupsWithUnread;
  }

  /**
   * Get breakdown of unread messages per group for a user
   */
  static async getUnreadCounts(userId: string): Promise<Record<string, number>> {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true, lastReadAt: true }
    });

    const counts: Record<string, number> = {};
    for (const membership of memberships) {
      const count = await prisma.message.count({
        where: {
          groupId: membership.groupId,
          createdAt: { gt: membership.lastReadAt },
          senderId: { not: userId }
        }
      });
      if (count > 0) {
        counts[membership.groupId] = count;
      }
    }
    return counts;
  }

  /**
   * Assign the next color in the pool to a member. Used by /changeColour.
   */
  static async changeMemberColor(groupId: string, userId: string) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { color: true }
    });
    const newColor = getNextColor(member?.color ?? null);
    await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { color: newColor }
    });
    return newColor;
  }
}
