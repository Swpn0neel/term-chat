import React, { useState, useEffect } from 'react';
import { ThemeProvider, draculaTheme, useInput } from 'termui';
import AuthScreen from '@/screens/AuthScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import AddFriendScreen from '@/screens/AddFriendScreen';
import PendingRequestsScreen from '@/screens/PendingRequestsScreen';
import FriendListScreen from '@/screens/FriendListScreen';
import GroupListScreen from '@/screens/GroupListScreen';
import CreateGroupScreen from '@/screens/CreateGroupScreen';
import GroupChatScreen from '@/screens/GroupChatScreen';
import ChatScreen from '@/screens/ChatScreen';
import AIChatScreen from '@/screens/AIChatScreen';
import RemoveFriendScreen from '@/screens/RemoveFriendScreen';
import SendFileScreen from '@/screens/SendFileScreen';
import InboxScreen from '@/screens/InboxScreen';
import { session } from '@/lib/session';
import { AuthService } from '@/services/authService';
import { SocialService } from '@/services/socialService';
import { GroupService } from '@/services/groupService';
import { countPendingTransfers, cleanupExpiredTransfers } from '@/services/fileTransferService';
import { shutdown } from '@/lib/shutdown';

export type Screen =
  | 'auth' | 'dashboard' | 'add-friend'
  | 'pending' | 'friend-list' | 'chat' | 'ai-chat' | 'remove-friend'
  | 'group-list' | 'create-group' | 'group-chat'
  | 'send-file' | 'inbox';

export type NavigateFn = (screen: Screen, params?: Record<string, string>) => void;

export default function App() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [params, setParams] = useState<Record<string, string>>({});
  const [sessionUser, setSessionUser] = useState<{ id: string; username: string } | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [groupUnreadCounts, setGroupUnreadCounts] = useState<Record<string, number>>({});
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);
  const [fileTransferCount, setFileTransferCount] = useState(0);

  const navigate: NavigateFn = (s, p = {}) => {
    setScreen(s);
    setParams(p);
  };

  // Sync session tracker
  useEffect(() => {
    session.setUserId(sessionUser?.id || null);
  }, [sessionUser]);

  // Heartbeat Loop (15 seconds) - Updates Status and Unread Counts
  useEffect(() => {
    if (!sessionUser) return;

    const fetchNotifications = async () => {
      try {
        await AuthService.updateHeartbeat(sessionUser.id);
        const counts = await SocialService.getUnreadCounts(sessionUser.id);
        const pending = await SocialService.getPendingCount(sessionUser.id);
        const gCounts = await GroupService.getUnreadCounts(sessionUser.id);
        const totalGUnread = Object.values(gCounts).reduce((a, b) => a + b, 0);
        const fileCount = await countPendingTransfers(sessionUser.id);
        await cleanupExpiredTransfers();
        
        setUnreadCounts(counts);
        setPendingCount(pending);
        setGroupUnreadCounts(gCounts);
        setGroupUnreadCount(totalGUnread);
        setFileTransferCount(fileCount);
      } catch (err) {}
    };

    // Initial fetch
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [sessionUser]);

  useInput((_input, key) => {
    if (key.escape) {
      if (screen === 'auth') {
        shutdown(sessionUser?.id || null);
      } else if (screen === 'dashboard') {
        // Handled by DashboardScreen component for sub-menu support
        return;
      } else {
        const menuMapping: Record<string, string> = {
          'add-friend': 'friends',
          'remove-friend': 'friends',
          'pending': 'friends',
          'friend-list': 'chats',
          'group-list': 'chats',
          'ai-chat': 'chats',
          'send-file': 'files',
          'inbox': 'files',
        };
        navigate('dashboard', { initialMenu: menuMapping[screen] || 'main' });
      }
    }
  });

  // Calculate total unread
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <ThemeProvider theme={draculaTheme}>
      {screen === 'auth'        && <AuthScreen onAuth={setSessionUser} navigate={navigate} />}
      {screen === 'dashboard'   && (
        <DashboardScreen 
          user={sessionUser!} 
          navigate={navigate} 
          params={params}
          unreadCount={totalUnread} 
          pendingCount={pendingCount} 
          groupUnreadCount={groupUnreadCount}
          fileTransferCount={fileTransferCount}
          onShutdown={() => shutdown(sessionUser?.id || null)}
        />
      )}
      {screen === 'add-friend'  && <AddFriendScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'pending'     && <PendingRequestsScreen user={sessionUser!} navigate={navigate} onUpdate={setPendingCount} />}
      {screen === 'friend-list' && <FriendListScreen user={sessionUser!} navigate={navigate} unreadCounts={unreadCounts} />}
      {screen === 'chat'        && <ChatScreen user={sessionUser!} friendId={params.friendId} navigate={navigate} onRead={() => {
        // Optimistically clear unread for this friend
        if (params.friendId) {
          setUnreadCounts(prev => {
            const next = { ...prev };
            delete next[params.friendId];
            return next;
          });
        }
      }} />}
      {screen === 'ai-chat'     && <AIChatScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'remove-friend' && <RemoveFriendScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'group-list'  && <GroupListScreen user={sessionUser!} navigate={navigate} unreadCounts={groupUnreadCounts} />}
      {screen === 'create-group' && <CreateGroupScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'group-chat'  && <GroupChatScreen user={sessionUser!} groupId={params.groupId} navigate={navigate} onRead={() => {
        if (params.groupId && groupUnreadCounts[params.groupId]) {
          const countToClear = groupUnreadCounts[params.groupId];
          setGroupUnreadCounts(prev => {
            const next = { ...prev };
            delete next[params.groupId];
            return next;
          });
          setGroupUnreadCount(prev => Math.max(0, prev - countToClear));
        }
      }} />}
      {screen === 'send-file'  && <SendFileScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'inbox'      && <InboxScreen user={sessionUser!} navigate={navigate} />}
    </ThemeProvider>
  );
}
