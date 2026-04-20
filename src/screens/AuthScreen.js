import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { TextInput } from '../components/ui/input/TextInput';
import { Alert } from '../components/ui/feedback/Alert';
import { Spinner } from '../components/ui/feedback/Spinner';
import { AuthService } from '../services/authService';
import { SessionService } from '../services/sessionService';
export default function AuthScreen({ onAuth, navigate }) {
    const theme = useTheme();
    const [mode, setMode] = useState('signin');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [activeField, setActiveField] = useState('username');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Start as loading for session check
    // ASCII Logo (Double Line Style)
    const LOGO = `
Welcome to Term Chat ❤️                                            
  `;
    // Auto-login check on mount
    useEffect(() => {
        const checkSession = async () => {
            const savedUserId = SessionService.getSession();
            if (savedUserId) {
                try {
                    const user = await AuthService.getUserById(savedUserId);
                    if (user) {
                        onAuth(user);
                        navigate('dashboard');
                        return;
                    }
                }
                catch (err) {
                    // If session is invalid, just stay on auth screen
                }
            }
            setIsLoading(false);
        };
        checkSession();
    }, []);
    const handleSubmit = async () => {
        if (!username || !password) {
            setError('Please fill in all fields.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            if (mode === 'signin') {
                const user = await AuthService.signIn(username, password);
                onAuth(user);
                navigate('dashboard');
            }
            else {
                const user = await AuthService.signUp(username, password);
                onAuth(user);
                navigate('dashboard');
            }
        }
        catch (err) {
            setError(err.message || 'Authentication failed.');
        }
        finally {
            setIsLoading(false);
        }
    };
    useInput((input, key) => {
        if (isLoading)
            return;
        if (key.upArrow || key.downArrow) {
            setActiveField(f => f === 'username' ? 'password' : 'username');
        }
        if (key.tab) {
            setMode(m => m === 'signin' ? 'signup' : 'signin');
            setError(null);
        }
        if (key.return && activeField === 'password') {
            handleSubmit();
        }
    });
    if (isLoading && !username) {
        return (_jsx(Box, { padding: 2, justifyContent: "center", alignItems: "center", children: _jsx(Spinner, { label: "Checking session..." }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Box, { marginBottom: 1, flexDirection: "column", children: [_jsx(Text, { color: "cyan", bold: true, children: LOGO }), _jsx(Text, { color: "gray", dimColor: true, italic: true, children: "     -- The Terminal Messaging Hub --" })] }), _jsxs(Box, { gap: 2, marginBottom: 1, children: [_jsxs(Text, { color: mode === 'signin' ? theme.colors.primary : undefined, bold: mode === 'signin', children: [mode === 'signin' ? '●' : '○', " Sign In"] }), _jsxs(Text, { color: mode === 'signup' ? theme.colors.primary : undefined, bold: mode === 'signup', children: [mode === 'signup' ? '●' : '○', " Sign Up"] })] }), _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: activeField === 'username' ? theme.colors.primary : undefined, children: "Username:" }), _jsx(TextInput, { id: "username", value: username, onChange: setUsername, autoFocus: activeField === 'username', bordered: activeField === 'username', placeholder: "enter username..." })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: activeField === 'password' ? theme.colors.primary : undefined, children: "Password:" }), _jsx(TextInput, { id: "password", value: password, onChange: setPassword, mask: "*", autoFocus: activeField === 'password', bordered: activeField === 'password', placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", onSubmit: handleSubmit })] })] }), error && (_jsx(Box, { marginTop: 1, children: _jsx(Alert, { variant: "error", children: error }) })), isLoading && (_jsx(Box, { marginTop: 1, gap: 1, children: _jsx(Spinner, { label: "Authenticating..." }) })), _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(Text, { color: theme.colors.mutedForeground, dimColor: true, children: "[\u2191/\u2193] Switch Field | [Tab] Toggle Mode | [Enter] Submit | [q] Quit" }) })] }));
}
