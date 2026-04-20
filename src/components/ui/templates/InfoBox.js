import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useTheme } from 'termui';
function InfoBoxRoot({ borderStyle = 'single', borderColor, padding = [0, 1], width, children, }) {
    const theme = useTheme();
    const resolvedBorderColor = borderColor ?? theme.colors.border;
    return (_jsx(Box, { borderStyle: borderStyle, borderColor: resolvedBorderColor, flexDirection: "column", paddingX: padding[1], paddingY: padding[0], width: width === 'full' ? undefined : width, flexGrow: width === 'full' ? 1 : undefined, children: children }));
}
function InfoBoxHeader({ icon, iconColor = 'green', label, description, version, versionColor = 'cyan', }) {
    return (_jsxs(Box, { flexDirection: "row", gap: 1, children: [icon && _jsx(Text, { color: iconColor, children: icon }), _jsx(Text, { bold: true, children: label }), description && _jsx(Text, { dimColor: true, children: description }), version && _jsx(Text, { color: versionColor, children: version })] }));
}
function InfoBoxRow({ label, value, valueDetail, valueColor, bold: boldValue = false, tree = false, color, }) {
    const theme = useTheme();
    const prefix = tree ? '└ ' : '';
    return (_jsxs(Box, { flexDirection: "row", children: [_jsxs(Text, { color: color ?? theme.colors.mutedForeground, children: [prefix, label, value ? ':' : ''] }), value && (_jsxs(Text, { bold: boldValue, color: color, children: ['  ', value] })), valueDetail && _jsx(Text, { color: valueColor ?? 'cyan', children: '  ' + valueDetail })] }));
}
function InfoBoxTreeRow(props) {
    return _jsx(InfoBoxRow, { ...props, tree: true });
}
export const InfoBox = Object.assign(InfoBoxRoot, {
    Header: InfoBoxHeader,
    Row: InfoBoxRow,
    TreeRow: InfoBoxTreeRow,
});
