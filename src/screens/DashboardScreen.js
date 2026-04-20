import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { AppShell } from '../components/ui/templates/AppShell';
import { Select } from '../components/ui/selection/Select';
import { SessionService } from '../services/sessionService';
export default function DashboardScreen({ user, navigate, unreadCount = 0 }) {
    const handleSelect = (val) => {
        if (val === 'auth') {
            // Deliberate Sign Out
            SessionService.clearSession();
            navigate('auth');
        }
        else {
            navigate(val);
        }
    };
    return (_jsxs(AppShell, { children: [_jsx(AppShell.Header, { children: _jsx(Box, { paddingX: 1, borderStyle: "single", borderColor: "cyan", children: _jsxs(Text, { bold: true, children: ["TermChat | Logged in as: ", user?.username ?? 'Guest'] }) }) }), _jsx(AppShell.Content, { children: _jsx(Box, { padding: 1, flexDirection: "column", children: _jsx(Select, { label: "Main Menu", options: [
                            { label: '👤 Add Friend', value: 'add-friend' },
                            { label: '🔔 Pending Requests', value: 'pending' },
                            {
                                label: `💬 Chat with Friends ${unreadCount > 0 ? '●' : ''}`,
                                value: 'friend-list',
                                hint: unreadCount > 0 ? `${unreadCount} new` : undefined
                            },
                            { label: '🤖 AI Chat', value: 'ai-chat' },
                            { label: '🚪 Sign Out', value: 'auth' }
                        ], onSubmit: handleSelect }) }) }), _jsx(AppShell.Hints, { items: ['q: Quit', '↑↓: Move', 'Enter: Select'] })] }));
}
