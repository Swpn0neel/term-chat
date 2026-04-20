import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useTheme } from 'termui';
function KeyLabel({ label, color }) {
    return (_jsx(Box, { borderStyle: "single", borderColor: color, paddingX: 1, children: _jsx(Text, { color: color, bold: true, children: label }) }));
}
function ShortcutRow({ shortcut, keyColor, descColor, }) {
    return (_jsxs(Box, { gap: 1, alignItems: "center", children: [_jsx(KeyLabel, { label: shortcut.key, color: keyColor }), _jsx(Text, { color: descColor, children: shortcut.description })] }));
}
export function KeyboardShortcuts({ shortcuts, columns = 1, title }) {
    const theme = useTheme();
    // Group by category if categories are present
    const hasCategories = shortcuts.some((s) => s.category);
    if (hasCategories) {
        const grouped = {};
        for (const s of shortcuts) {
            const cat = s.category ?? 'General';
            if (!grouped[cat])
                grouped[cat] = [];
            grouped[cat].push(s);
        }
        return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [title && (_jsxs(Text, { color: theme.colors.primary, bold: true, children: ["\u2328 ", title] })), Object.entries(grouped).map(([category, items]) => (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsx(Text, { color: theme.colors.mutedForeground, bold: true, underline: true, children: category }), columns > 1 ? (_jsx(ShortcutGrid, { items: items, columns: columns, theme: theme })) : (items.map((s, i) => (_jsx(ShortcutRow, { shortcut: s, keyColor: theme.colors.primary, descColor: theme.colors.foreground }, i))))] }, category)))] }));
    }
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [title && (_jsxs(Text, { color: theme.colors.primary, bold: true, children: ["\u2328 ", title] })), columns > 1 ? (_jsx(ShortcutGrid, { items: shortcuts, columns: columns, theme: theme })) : (shortcuts.map((s, i) => (_jsx(ShortcutRow, { shortcut: s, keyColor: theme.colors.primary, descColor: theme.colors.foreground }, i))))] }));
}
function ShortcutGrid({ items, columns, theme, }) {
    const rows = [];
    for (let i = 0; i < items.length; i += columns) {
        rows.push(items.slice(i, i + columns));
    }
    return (_jsx(Box, { flexDirection: "column", gap: 0, children: rows.map((row, ri) => (_jsx(Box, { gap: 3, children: row.map((s, ci) => (_jsx(ShortcutRow, { shortcut: s, keyColor: theme.colors.primary, descColor: theme.colors.foreground }, ci))) }, ri))) }));
}
