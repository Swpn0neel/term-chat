import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useTheme, useInput } from 'termui';
export function ChatMessage({ role, name, timestamp, streaming = false, collapsed: initialCollapsed = false, children, }) {
    const theme = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
    const [dotFrame, setDotFrame] = useState(0);
    // Typing indicator animation
    useEffect(() => {
        if (!streaming)
            return;
        const id = setInterval(() => setDotFrame((f) => (f + 1) % 4), 400);
        return () => clearInterval(id);
    }, [streaming]);
    // Toggle collapse on Enter/Space when focused
    useInput((input, key) => {
        if (initialCollapsed && (key.return || input === ' ')) {
            setIsCollapsed((c) => !c);
        }
    });
    const roleColor = {
        user: theme.colors.primary,
        assistant: theme.colors.success ?? 'green',
        system: theme.colors.mutedForeground,
        error: theme.colors.error ?? 'red',
    };
    const roleLabel = {
        user: 'user',
        assistant: 'assistant',
        system: 'system',
        error: 'error',
    };
    const color = roleColor[role];
    const dots = ['', '●', '●●', '●●●'][dotFrame] ?? '';
    // Get first line of children for collapsed display
    const childrenText = typeof children === 'string' ? children : '';
    const firstLine = childrenText.split('\n')[0] ?? '';
    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { gap: 1, children: [_jsx(Text, { color: color, bold: true, children: name ?? roleLabel[role] }), timestamp && (_jsx(Text, { dimColor: true, color: theme.colors.mutedForeground, children: formatTime(timestamp) })), isCollapsed && !streaming && (_jsx(Text, { dimColor: true, color: theme.colors.mutedForeground, children: "[expand]" }))] }), streaming ? (_jsx(Box, { children: children ? (_jsx(_Fragment, { children: children })) : (_jsx(Text, { color: color, dimColor: true, children: dots })) })) : isCollapsed ? (_jsx(Box, { children: _jsxs(Text, { dimColor: true, children: [firstLine.slice(0, 60), firstLine.length > 60 || childrenText.includes('\n') ? '...' : ''] }) })) : (_jsx(Box, { children: children }))] }));
}
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
