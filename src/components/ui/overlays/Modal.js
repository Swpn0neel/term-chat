import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
export function Modal({ open, onClose, title, width = 60, children, borderStyle = 'round', borderColor, paddingX = 1, paddingY = 0, titleBorderStyle = 'single', closeHint = 'Press Esc to close', }) {
    const theme = useTheme();
    const resolvedBorderColor = borderColor ?? theme.colors.primary;
    useInput((input, key) => {
        if (!open)
            return;
        if (key.escape)
            onClose();
    }, { isActive: open });
    if (!open)
        return null;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: borderStyle, borderColor: resolvedBorderColor, width: width, paddingX: paddingX, paddingY: paddingY, children: [title && (_jsx(Box, { marginBottom: 1, borderStyle: titleBorderStyle, borderColor: theme.colors.border, paddingX: 1, children: _jsx(Text, { bold: true, color: resolvedBorderColor, children: title }) })), _jsx(Box, { flexDirection: "column", children: children }), closeHint !== false && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.colors.mutedForeground, dimColor: true, children: closeHint }) }))] }));
}
