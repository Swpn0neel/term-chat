import React, { useState, useEffect } from 'react';
import { ThemeProvider, draculaTheme, useInput, getThemeByName } from '@/lib/theme';
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
import ChangePasswordScreen from '@/screens/ChangePasswordScreen';
import UpdateBioScreen from '@/screens/UpdateBioScreen';
import { session } from '@/lib/session';
import { SessionService } from '@/services/sessionService';
import { AppService } from '@/services/appService';
import { cleanupExpiredTransfers } from '@/services/fileTransferService';
import { shutdown } from '@/lib/shutdown';
import { PollingProvider, usePolling } from '@/contexts/PollingContext';

export type Screen =
  | 'auth' | 'dashboard' | 'add-friend'
  | 'pending' | 'friend-list' | 'chat' | 'ai-chat' | 'remove-friend'
  | 'group-list' | 'create-group' | 'group-chat'
  | 'send-file' | 'inbox' | 'change-password' | 'update-bio';

export type NavigateFn = (screen: Screen, params?: Record<string, string>) => void;

function AppContent({
  screen, params, sessionUser, navigate, setSessionUser
}: {
  screen: Screen, params: Record<string, string>, sessionUser: { id: string; username: string; theme?: string } | null,
  navigate: NavigateFn, setSessionUser: (user: any) => void
}) {
  const { setPollData, global, setOnImmediatePoll } = usePolling();
  const [userTheme, setUserTheme] = useState(() => {
    const saved = SessionService.getSession();
    return saved?.themeName ? getThemeByName(saved.themeName) : draculaTheme;
  });

  // Initial theme from sessionUser
  useEffect(() => {
    if (sessionUser?.theme) {
      setUserTheme(getThemeByName(sessionUser.theme));
    }
  }, [sessionUser]);

  // Sync theme from polled data
  useEffect(() => {
    if (global.theme) {
      const t = getThemeByName(global.theme);
      if (t.name !== userTheme.name) {
        setUserTheme(t);
      }
    }
  }, [global.theme, userTheme.name]);

  const activeTheme = userTheme;

  // Polling Loop
  useEffect(() => {
    if (!sessionUser) return;

    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;
    let isPolling = false;

    const doPoll = async () => {
      if (isPolling || isCancelled) return;
      isPolling = true;
      
      const startTime = Date.now();
      try {
        // Run pollState
        const data = await AppService.pollState(sessionUser.id, screen, params);
        if (isCancelled) {
          isPolling = false;
          return;
        }
        
        // Update UI immediately
        setPollData(data);

        // Update connection status based on DB latency only
        const latency = Date.now() - startTime;
        session.setConnectionStatus(latency > 1000 ? 'slow' : 'online');

        // Schedule next poll
        clearTimeout(timeoutId);
        timeoutId = setTimeout(doPoll, 1000);
      } catch (err) {
        if (isCancelled) {
          isPolling = false;
          return;
        }
        session.setConnectionStatus('disconnected');
        clearTimeout(timeoutId);
        timeoutId = setTimeout(doPoll, 5000);
      } finally {
        isPolling = false;
      }
    };

    // Register immediate poll trigger
    setOnImmediatePoll(() => {
      clearTimeout(timeoutId);
      doPoll();
    });

    doPoll();
    
    // Cleanup expired transfers less frequently (every 30s)
    const cleanupInterval = setInterval(() => {
      cleanupExpiredTransfers().catch(() => {});
    }, 30000);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      clearInterval(cleanupInterval);
    };
  }, [sessionUser, screen, params, setPollData, setOnImmediatePoll]);

  useInput((_input, key) => {
    if (key.escape) {
      if (screen === 'auth') {
        shutdown(sessionUser?.id || null);
      } else if (screen === 'dashboard') {
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
          'change-password': 'settings',
          'update-bio': 'settings',
        };
        navigate('dashboard', { initialMenu: menuMapping[screen] || 'main' });
      }
    }
  });

  const totalUnread = Object.values(global.unreadCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <ThemeProvider theme={activeTheme}>
      {screen === 'auth'        && <AuthScreen onAuth={setSessionUser} navigate={navigate} />}
      {screen === 'dashboard'   && (
        <DashboardScreen 
          user={sessionUser!} 
          navigate={navigate} 
          params={params}
          unreadCount={totalUnread} 
          pendingCount={global.pendingCount || 0} 
          groupUnreadCount={global.totalGroupUnread || 0}
          fileTransferCount={global.fileTransferCount || 0}
          onShutdown={() => shutdown(sessionUser?.id || null)}
        />
      )}
      {screen === 'add-friend'  && <AddFriendScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'pending'     && <PendingRequestsScreen user={sessionUser!} navigate={navigate} onUpdate={() => {}} />}
      {screen === 'friend-list' && <FriendListScreen user={sessionUser!} navigate={navigate} unreadCounts={global.unreadCounts || {}} />}
      {screen === 'chat'        && <ChatScreen key={params.friendId} user={sessionUser!} friendId={params.friendId} navigate={navigate} onRead={() => {}} />}
      {screen === 'ai-chat'     && <AIChatScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'remove-friend' && <RemoveFriendScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'group-list'  && <GroupListScreen user={sessionUser!} navigate={navigate} unreadCounts={global.groupUnreadCounts || {}} />}
      {screen === 'create-group' && <CreateGroupScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'group-chat'  && <GroupChatScreen key={params.groupId} user={sessionUser!} groupId={params.groupId} navigate={navigate} onRead={() => {}} />}
      {screen === 'send-file'  && <SendFileScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'inbox'      && <InboxScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'change-password' && <ChangePasswordScreen user={sessionUser!} navigate={navigate} />}
      {screen === 'update-bio' && <UpdateBioScreen user={sessionUser!} navigate={navigate} onUpdateUser={setSessionUser} />}
    </ThemeProvider>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('auth');
  const [params, setParams] = useState<Record<string, string>>({});
  const [sessionUser, setSessionUser] = useState<{ id: string; username: string; theme?: string } | null>(null);

  const navigate: NavigateFn = (s, p = {}) => {
    setScreen(s);
    setParams(p);
  };

  useEffect(() => {
    session.setUserId(sessionUser?.id || null);
  }, [sessionUser]);

  return (
    <PollingProvider>
      <AppContent 
        screen={screen} 
        params={params} 
        sessionUser={sessionUser} 
        navigate={navigate} 
        setSessionUser={setSessionUser} 
      />
    </PollingProvider>
  );
}
