import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useTheme } from 'termui';
function BulletListRoot({ children }) {
    return _jsx(Box, { flexDirection: "column", children: children });
}
function BulletListItem({ label, bold: boldText = false, color, children }) {
    const theme = useTheme();
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: color ?? theme.colors.primary, children: '● ' }), _jsx(Text, { bold: boldText, color: color, children: label })] }), children] }));
}
function BulletListSub({ children }) {
    return (_jsx(Box, { flexDirection: "column", paddingLeft: 2, children: children }));
}
function BulletListTreeItem({ label, color }) {
    const theme = useTheme();
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: theme.colors.mutedForeground, children: '└ ' }), _jsx(Text, { color: color, children: label })] }));
}
function BulletListCheckItem({ label, done = false, color }) {
    const theme = useTheme();
    const icon = done ? '■' : '□';
    const resolvedColor = color ?? (done ? theme.colors.success : theme.colors.mutedForeground);
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: resolvedColor, children: icon + ' ' }), _jsx(Text, { color: done ? undefined : color, children: label })] }));
}
export const BulletList = Object.assign(BulletListRoot, {
    Item: BulletListItem,
    Sub: BulletListSub,
    TreeItem: BulletListTreeItem,
    CheckItem: BulletListCheckItem,
});
