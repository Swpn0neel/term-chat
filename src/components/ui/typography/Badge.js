import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useTheme } from 'termui';
export function Badge({ children, variant = 'default', color, bold = false, bordered = true, borderStyle = 'round', paddingX = 1, }) {
    const theme = useTheme();
    const variantColor = color ??
        (() => {
            switch (variant) {
                case 'success':
                    return theme.colors.success;
                case 'warning':
                    return theme.colors.warning;
                case 'error':
                    return theme.colors.error;
                case 'info':
                    return theme.colors.info;
                case 'secondary':
                    return theme.colors.secondary;
                default:
                    return theme.colors.primary;
            }
        })();
    if (!bordered) {
        return (_jsx(Text, { color: variantColor, bold: bold, children: children }));
    }
    return (_jsx(Box, { borderStyle: borderStyle, borderColor: variantColor, paddingX: paddingX, children: _jsx(Text, { color: variantColor, bold: bold, children: children }) }));
}
