import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from 'termui';
const ICONS = {
    info: 'ℹ',
    warning: '⚠',
    error: '✗',
    success: '✓',
    neutral: '·',
};
export function Banner({ children, variant = 'info', icon, title, dismissible = false, onDismiss, color, accentChar = '┃', gap = 1, }) {
    const theme = useTheme();
    const [dismissed, setDismissed] = useState(false);
    const variantColor = color ??
        (() => {
            switch (variant) {
                case 'success':
                    return theme.colors.success;
                case 'error':
                    return theme.colors.error;
                case 'warning':
                    return theme.colors.warning;
                case 'neutral':
                    return theme.colors.muted;
                default:
                    return theme.colors.info;
            }
        })();
    useInput((_, key) => {
        if (dismissible && key.escape) {
            setDismissed(true);
            onDismiss?.();
        }
    });
    if (dismissed)
        return null;
    const resolvedIcon = icon ?? ICONS[variant];
    return (_jsx(Box, { flexDirection: "column", children: _jsxs(Box, { flexDirection: "row", gap: gap, children: [_jsx(Text, { color: variantColor, children: accentChar }), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", gap: 1, children: [_jsx(Text, { color: variantColor, children: resolvedIcon }), title && (_jsxs(Text, { bold: true, color: variantColor, children: [title, ":"] })), _jsx(Text, { children: children })] }), dismissible && (_jsx(Text, { color: theme.colors.muted, dimColor: true, children: "press Esc to dismiss" }))] })] }) }));
}
