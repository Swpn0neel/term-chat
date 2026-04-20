import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { Select } from '../components/ui/selection/Select';
import { Alert } from '../components/ui/feedback/Alert';
import { Spinner } from '../components/ui/feedback/Spinner';
import { SocialService } from '../services/socialService';
export default function FriendListScreen({ user, navigate, unreadCounts = {} }) {
    const theme = useTheme();
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchFriends = async () => {
        try {
            const data = await SocialService.getFriendList(user.id);
            setFriends(data);
        }
        catch (err) {
            setError('Failed to load friends.');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchFriends();
        // Polling friends status every 10 seconds
        const interval = setInterval(fetchFriends, 10000);
        return () => clearInterval(interval);
    }, [user.id]);
    useInput((_input, key) => {
        if (key.escape) {
            navigate('dashboard');
        }
    });
    return (_jsxs(AppShell, { children: [_jsx(AppShell.Header, { children: _jsx(Box, { paddingX: 1, borderStyle: "single", borderColor: "magenta", children: _jsx(Text, { bold: true, children: "My Friends" }) }) }), _jsxs(AppShell.Content, { children: [isLoading && friends.length === 0 ? (_jsx(Box, { padding: 1, children: _jsx(Spinner, { label: "Loading friend list..." }) })) : friends.length === 0 ? (_jsxs(Box, { padding: 1, flexDirection: "column", children: [_jsx(Text, { dimColor: true, children: "Your friend list is empty." }), _jsx(Text, { marginTop: 1, children: "Go to 'Add Friend' to connect with others!" })] })) : (_jsx(Box, { padding: 1, children: _jsx(Select, { label: "Select a friend to start chatting:", options: friends.map(f => {
                                // Calculation: Is online if flag is true AND seen recently (< 30s)
                                const lastSeenDate = new Date(f.lastSeen);
                                const diffSeconds = (Date.now() - lastSeenDate.getTime()) / 1000;
                                const isTrulyOnline = f.isOnline && diffSeconds < 30;
                                const count = unreadCounts[f.id] || 0;
                                return {
                                    label: `💬 ${f.username} ${count > 0 ? '●' : ''}`,
                                    value: f.id,
                                    hint: (_jsxs(Text, { children: [_jsx(Text, { color: isTrulyOnline ? '#50fa7b' : 'gray', children: isTrulyOnline ? '● Online' : '○ Offline' }), count > 0 && _jsxs(Text, { color: "yellow", children: [" (", count, " new)"] })] }))
                                };
                            }), onSubmit: (friendId) => navigate('chat', { friendId }) }) })), error && (_jsx(Box, { paddingX: 1, children: _jsx(Alert, { variant: "error", children: error }) }))] }), _jsx(AppShell.Hints, { items: ['↑↓: Move', 'Enter: Chat', 'Esc: Back', 'q: Quit'] })] }));
}
