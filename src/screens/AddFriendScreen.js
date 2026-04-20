import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { TextInput } from '../components/ui/input/TextInput';
import { Alert } from '../components/ui/feedback/Alert';
import { Spinner } from '../components/ui/feedback/Spinner';
import { SocialService } from '../services/socialService';
export default function AddFriendScreen({ user, navigate }) {
    const theme = useTheme();
    const [username, setUsername] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async () => {
        if (!username)
            return;
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await SocialService.sendRequest(user.id, username);
            setSuccess(`Friend request sent to ${username}!`);
            setUsername('');
        }
        catch (err) {
            setError(err.message || 'Failed to send request.');
        }
        finally {
            setIsLoading(false);
        }
    };
    useInput((_input, key) => {
        if (key.escape) {
            navigate('dashboard');
        }
    });
    return (_jsxs(AppShell, { children: [_jsx(AppShell.Header, { children: _jsx(Box, { paddingX: 1, borderStyle: "single", borderColor: "green", children: _jsx(Text, { bold: true, children: "Add Friend" }) }) }), _jsx(AppShell.Content, { children: _jsxs(Box, { padding: 1, flexDirection: "column", children: [_jsx(Text, { children: "Enter a username to send a private friend request." }), _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(TextInput, { label: "User to invite:", value: username, onChange: setUsername, onSubmit: handleSubmit, placeholder: "e.g. alice", autoFocus: true }) }), isLoading && (_jsx(Box, { marginTop: 1, children: _jsx(Spinner, { label: "Sending request..." }) })), error && (_jsx(Box, { marginTop: 1, children: _jsx(Alert, { variant: "error", children: error }) })), success && (_jsx(Box, { marginTop: 1, children: _jsx(Alert, { variant: "success", children: success }) }))] }) }), _jsx(AppShell.Hints, { items: ['Esc: Back', 'Enter: Send Request', 'q: Quit'] })] }));
}
