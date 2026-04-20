import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useTheme } from 'termui';
const ICONS = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
};
export function Alert({ variant = 'info', title, children, icon, bordered = true, borderStyle, color, paddingX = 1, paddingY = 0, }) {
    const theme = useTheme();
    const variantColor = color ??
        (() => {
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
    const resolvedIcon = icon ?? ICONS[variant];
    return (_jsxs(Box, { borderStyle: bordered ? (borderStyle ?? theme.border.style) : undefined, borderColor: variantColor, paddingX: paddingX, paddingY: paddingY, flexDirection: "row", gap: 1, alignItems: "center", children: [_jsx(Text, { color: variantColor, bold: true, children: resolvedIcon }), title && (_jsx(Text, { bold: true, color: variantColor, children: title })), children && (_jsx(Text, { children: children }))] }));
}
