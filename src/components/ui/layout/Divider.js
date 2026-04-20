import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useTheme } from 'termui';
const HORIZONTAL_CHARS = {
    single: '─',
    double: '═',
    bold: '━',
};
const VERTICAL_CHARS = {
    single: '│',
    double: '║',
    bold: '┃',
};
export function Divider({ variant = 'single', orientation = 'horizontal', color, label, height = 1, width, }) {
    const theme = useTheme();
    const resolvedColor = color ?? theme.colors.border;
    const hChar = HORIZONTAL_CHARS[variant];
    const vChar = VERTICAL_CHARS[variant];
    if (orientation === 'vertical') {
        const lines = Array.from({ length: height }, (_, i) => i);
        return (_jsx(Box, { flexDirection: "column", children: lines.map((i) => (_jsx(Text, { color: resolvedColor, children: vChar }, i))) }));
    }
    // Horizontal
    if (label) {
        return (_jsxs(Box, { flexDirection: "row", width: width, children: [_jsxs(Text, { color: resolvedColor, children: [hChar, hChar, hChar, ' '] }), _jsx(Text, { color: resolvedColor, children: label }), _jsxs(Text, { color: resolvedColor, children: [' ', hChar, hChar, hChar] }), _jsx(Box, { flexGrow: 1, children: _jsx(Text, { color: resolvedColor, children: hChar.repeat(1) }) })] }));
    }
    return (_jsx(Box, { width: width ?? '100%', children: _jsx(Text, { color: resolvedColor, wrap: "truncate", children: hChar.repeat(width ?? 80) }) }));
}
