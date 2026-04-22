import React, { useState, useEffect } from 'react';
import { ThemeProvider, draculaTheme, useInput } from 'termui';
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddFriendScreen from './screens/AddFriendScreen';
import PendingRequestsScreen from './screens/PendingRequestsScreen';
import FriendListScreen from './screens/FriendListScreen';
import GroupListScreen from './screens/GroupListScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import GroupChatScreen from './screens/GroupChatScreen';
import ChatScreen from './screens/ChatScreen';
import AIChatScreen from './screens/AIChatScreen';
import { session } from './lib/session';
import { AuthService } from './services/authService';
import { SocialService } from './services/socialService';
import { GroupService } from './services/groupService';
import { shutdown } from './lib/shutdown';

export type Screen =
  | 'auth' | 'dashboard' | 'add-friend'
  | 'pending' | 'friend-list' | 'chat' | 'ai-chat'
  | 'group-list' | 'create-group' | 'group-chat';

export type NavigateFn = (screen: Screen, params?: Record<string, string>) => void;

export default function App() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [params, setParams] = useState<Record<string, string>>({});
  const [sessionUser, setSessionUser] = useState<{ id: string; username: string } | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);

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
        const groupUnread = await GroupService.getUnreadCount(sessionUser.id);
        setUnreadCounts(counts);
        setPendingCount(pending);
        setGroupUnreadCount(groupUnread);
      } catch (err) {}
    };

    // Initial fetch
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [sessionUser]);

  useInput((_input, key) => {
    if (key.escape) {
      if (screen === 'auth' || screen === 'dashboard') {
        shutdown(sessionUser?.id || null);
      } else {
        setScreen('dashboard');
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
          unreadCount={totalUnread} 
          pendingCount={pendingCount} 
          groupUnreadCount={groupUnreadCount}
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
      {screen === 'group-list'  && <GroupListScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'create-group' && <CreateGroupScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'group-chat'  && <GroupChatScreen user={sessionUser!} groupId={params.groupId} navigate={navigate} />}
    </ThemeProvider>
  );
}
