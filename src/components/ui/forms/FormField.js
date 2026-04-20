import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useTheme } from 'termui';
export function FormField({ label, children, error, hint, required, gap = 0, errorIcon = '✗', labelColor, }) {
    const theme = useTheme();
    const resolvedLabelColor = labelColor ?? theme.colors.foreground;
    return (_jsxs(Box, { flexDirection: "column", gap: gap, children: [_jsxs(Box, { gap: 0, children: [_jsx(Text, { bold: true, color: resolvedLabelColor, children: label }), required && _jsx(Text, { color: theme.colors.error, children: " *" })] }), _jsx(Box, { children: children }), hint && !error && (_jsx(Text, { color: theme.colors.mutedForeground, dimColor: true, children: hint })), error && (_jsxs(Text, { color: theme.colors.error, children: [errorIcon, " ", error] }))] }));
}
