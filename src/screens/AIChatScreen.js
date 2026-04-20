import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { Spinner } from '../components/ui/feedback/Spinner';
import { AIService } from '../services/aiService';
import { shutdown } from '../lib/shutdown';
export default function AIChatScreen({ user, navigate }) {
    const theme = useTheme();
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // Load history from DB on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const dbHistory = await AIService.getHistory(user.id);
                setHistory(dbHistory);
            }
            catch (err) {
                // Silent fail to protect UI
            }
            finally {
                setIsLoading(false);
            }
        };
        loadHistory();
    }, [user.id]);
    const handleSubmit = async () => {
        const userMessage = input.trim();
        if (!userMessage || isThinking)
            return;
        // Handle slash commands
        if (userMessage.toLowerCase() === '/quit') {
            await shutdown(user.id);
            return;
        }
        if (userMessage.toLowerCase() === '/clear') {
            try {
                await AIService.clearHistory(user.id);
                setHistory([]);
                setInput('');
            }
            catch (err) { }
            return;
        }
        setInput('');
        // Update local history
        const newHistory = [
            ...history,
            { role: 'user', parts: [{ text: userMessage }] }
        ];
        setHistory(newHistory);
        setIsThinking(true);
        try {
            // Save User Message to DB
            await AIService.saveMessage(user.id, userMessage, false);
            const response = await AIService.sendChatMessage(userMessage, history);
            // Save AI Message to DB
            await AIService.saveMessage(user.id, response, true);
            setHistory(h => [
                ...h,
                { role: 'model', parts: [{ text: response }] }
            ]);
        }
        catch (err) {
            const fallback = "sorry, an error occured from my side. try again later.";
            // Save Error Fallback to DB
            await AIService.saveMessage(user.id, fallback, true);
            setHistory(h => [
                ...h,
                { role: 'model', parts: [{ text: fallback }] }
            ]);
        }
        finally {
            setIsThinking(false);
        }
    };
    useInput((_input, key) => {
        if (key.escape) {
            navigate('dashboard');
        }
    });
    return (_jsxs(AppShell, { children: [_jsx(AppShell.Header, { children: _jsx(Box, { paddingX: 1, borderStyle: "single", borderColor: "yellow", children: _jsx(Text, { bold: true, children: "\u2728 TermChat AI Assistant" }) }) }), _jsx(AppShell.Content, { children: _jsxs(Box, { flexDirection: "column", paddingX: 1, paddingY: 1, children: [isLoading && history.length === 0 && (_jsx(Spinner, { label: "Loading conversation history..." })), history.length === 0 && !isThinking && !isLoading && (_jsx(Text, { dimColor: true, italic: true, children: "Hello! I am your AI assistant. Ask me anything about the terminal, coding, or TermChat!" })), history.map((turn, idx) => (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { color: turn.role === 'user' ? 'green' : 'cyan', bold: true, children: turn.role === 'user' ? 'You:' : 'TermChat AI:' }), _jsx(Text, { children: turn.parts[0].text })] }, idx))), isThinking && (_jsx(Box, { marginTop: 1, gap: 1, children: _jsx(Spinner, { label: "TermChat AI is thinking..." }) }))] }) }), _jsx(AppShell.Input, { placeholder: "Ask the AI something...", value: input, onChange: setInput, onSubmit: handleSubmit, borderStyle: "round", borderColor: "yellow" }), _jsx(AppShell.Hints, { items: ['/quit: Close App', '/clear: Clear History', 'Enter: Ask', 'Esc: Back'] })] }));
}
