import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useTheme, useInterval } from 'termui';
const ICONS = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
};
const BAR_WIDTH = 20;
const TICK_MS = 100;
export function Toast({ message, variant = 'info', duration = 3000, onDismiss, icon }) {
    const theme = useTheme();
    const [elapsed, setElapsed] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const variantColor = (() => {
        switch (variant) {
            case 'success':
                return theme.colors.success;
            case 'error':
                return theme.colors.error;
            case 'warning':
                return theme.colors.warning;
            default:
                return theme.colors.info;
        }
    })();
    // Auto-dismiss after duration
    useEffect(() => {
        const id = setTimeout(() => {
            setDismissed(true);
            onDismiss?.();
        }, duration);
        return () => clearTimeout(id);
    }, [duration, onDismiss]);
    // Tick every 100ms for countdown display
    useInterval(() => {
        setElapsed((e) => Math.min(e + TICK_MS, duration));
    }, dismissed ? null : TICK_MS);
    if (dismissed)
        return null;
    const remaining = Math.max(0, duration - elapsed);
    const remainingSeconds = (remaining / 1000).toFixed(1);
    const progress = remaining / duration; // 1.0 → 0.0
    const filledChars = Math.round(progress * BAR_WIDTH);
    const emptyChars = BAR_WIDTH - filledChars;
    const bar = '█'.repeat(filledChars) + '░'.repeat(emptyChars);
    const resolvedIcon = icon ?? ICONS[variant];
    return (_jsxs(Box, { borderStyle: "round", borderColor: variantColor, paddingX: 1, paddingY: 0, flexDirection: "column", children: [_jsxs(Box, { gap: 1, children: [_jsx(Text, { color: variantColor, bold: true, children: resolvedIcon }), _jsx(Text, { children: message })] }), _jsxs(Box, { gap: 1, children: [_jsx(Text, { color: variantColor, children: bar }), _jsxs(Text, { color: theme.colors.muted, children: [remainingSeconds, "s"] })] })] }));
}
