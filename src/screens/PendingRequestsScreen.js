import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { Alert } from '../components/ui/feedback/Alert';
import { Spinner } from '../components/ui/feedback/Spinner';
import { SocialService } from '../services/socialService';
export default function PendingRequestsScreen({ user, navigate }) {
    const theme = useTheme();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const data = await SocialService.getPendingRequests(user.id);
            setRequests(data);
        }
        catch (err) {
            setError('Failed to load requests.');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchRequests();
    }, [user.id]);
    const handleAction = async (action) => {
        const request = requests[selectedIndex];
        if (!request)
            return;
        setIsLoading(true);
        try {
            await SocialService.respondToRequest(request.id, action);
            // Remove from local list
            setRequests(reqs => reqs.filter(r => r.id !== request.id));
            if (selectedIndex >= requests.length - 1 && selectedIndex > 0) {
                setSelectedIndex(selectedIndex - 1);
            }
        }
        catch (err) {
            setError(`Failed to ${action.toLowerCase()} request.`);
        }
        finally {
            setIsLoading(false);
        }
    };
    useInput((input, key) => {
        if (isLoading)
            return;
        if (key.escape) {
            navigate('dashboard');
        }
        if (key.upArrow) {
            setSelectedIndex(i => Math.max(0, i - 1));
        }
        if (key.downArrow) {
            setSelectedIndex(i => Math.min(requests.length - 1, i + 1));
        }
        if (input === 'a' || input === 'A') {
            handleAction('ACCEPT');
        }
        if (input === 'd' || input === 'D') {
            handleAction('DECLINE');
        }
    });
    return (_jsxs(AppShell, { children: [_jsx(AppShell.Header, { children: _jsx(Box, { paddingX: 1, borderStyle: "single", borderColor: "yellow", children: _jsx(Text, { bold: true, children: "Pending Friend Requests" }) }) }), _jsxs(AppShell.Content, { children: [isLoading && requests.length === 0 ? (_jsx(Box, { padding: 1, children: _jsx(Spinner, { label: "Loading requests..." }) })) : requests.length === 0 ? (_jsx(Box, { padding: 1, children: _jsx(Text, { dimColor: true, children: "No pending requests. Go add some friends!" }) })) : (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, marginBottom: 1, children: "Choose a request and use A (Accept) or D (Decline):" }), requests.map((req, idx) => {
                                const isActive = idx === selectedIndex;
                                return (_jsxs(Box, { gap: 1, children: [_jsx(Text, { color: isActive ? theme.colors.primary : undefined, children: isActive ? '›' : ' ' }), _jsx(Text, { color: isActive ? theme.colors.primary : undefined, bold: isActive, children: req.sender.username }), _jsxs(Text, { dimColor: true, children: ["(", new Date(req.createdAt).toLocaleDateString(), ")"] })] }, req.id));
                            })] })), error && (_jsx(Box, { paddingX: 1, children: _jsx(Alert, { variant: "error", children: error }) }))] }), _jsx(AppShell.Hints, { items: ['a: Accept', 'd: Decline', 'Esc: Back', 'q: Quit'] })] }));
}
