import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ThemeProvider, draculaTheme, useInput } from 'termui';
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddFriendScreen from './screens/AddFriendScreen';
import PendingRequestsScreen from './screens/PendingRequestsScreen';
import FriendListScreen from './screens/FriendListScreen';
import ChatScreen from './screens/ChatScreen';
import AIChatScreen from './screens/AIChatScreen';
import { session } from './lib/session';
import { AuthService } from './services/authService';
import { SocialService } from './services/socialService';
import { shutdown } from './lib/shutdown';
export default function App() {
    const [screen, setScreen] = useState('auth');
    const [params, setParams] = useState({});
    const [sessionUser, setSessionUser] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const navigate = (s, p = {}) => {
        setScreen(s);
        setParams(p);
    };
    // Sync session tracker
    useEffect(() => {
        session.setUserId(sessionUser?.id || null);
    }, [sessionUser]);
    // Heartbeat Loop (15 seconds) - Updates Status and Unread Counts
    useEffect(() => {
        if (!sessionUser)
            return;
        const fetchNotifications = async () => {
            try {
                await AuthService.updateHeartbeat(sessionUser.id);
                const counts = await SocialService.getUnreadCounts(sessionUser.id);
                setUnreadCounts(counts);
            }
            catch (err) { }
        };
        // Initial fetch
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [sessionUser]);
    useInput((input, key) => {
        if (input === 'q' && screen !== 'chat' && screen !== 'ai-chat') {
            shutdown(sessionUser?.id || null);
        }
        if (key.escape && screen !== 'auth' && screen !== 'dashboard') {
            setScreen('dashboard');
        }
    });
    // Calculate total unread
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    return (_jsxs(ThemeProvider, { theme: draculaTheme, children: [screen === 'auth' && _jsx(AuthScreen, { onAuth: setSessionUser, navigate: navigate }), screen === 'dashboard' && _jsx(DashboardScreen, { user: sessionUser, navigate: navigate, unreadCount: totalUnread }), screen === 'add-friend' && _jsx(AddFriendScreen, { user: sessionUser, navigate: navigate }), screen === 'pending' && _jsx(PendingRequestsScreen, { user: sessionUser, navigate: navigate }), screen === 'friend-list' && _jsx(FriendListScreen, { user: sessionUser, navigate: navigate, unreadCounts: unreadCounts }), screen === 'chat' && _jsx(ChatScreen, { user: sessionUser, friendId: params.friendId, navigate: navigate, onRead: () => {
                    // Optimistically clear unread for this friend
                    if (params.friendId) {
                        setUnreadCounts(prev => {
                            const next = { ...prev };
                            delete next[params.friendId];
                            return next;
                        });
                    }
                } }), screen === 'ai-chat' && _jsx(AIChatScreen, { user: sessionUser, navigate: navigate })] }));
}
