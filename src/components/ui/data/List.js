import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
export function List({ items, onSelect, filterable = false, height = 10, cursor = '›', }) {
    const theme = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const [filter, setFilter] = useState('');
    const filtered = useMemo(() => {
        if (!filter)
            return items;
        const q = filter.toLowerCase();
        return items.filter((item) => item.label.toLowerCase().includes(q));
    }, [items, filter]);
    useInput((input, key) => {
        if (key.upArrow) {
            setActiveIndex((i) => Math.max(0, i - 1));
        }
        else if (key.downArrow) {
            setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
        }
        else if (key.return) {
            const item = filtered[activeIndex];
            if (item)
                onSelect?.(item);
        }
        else if (filterable && key.backspace) {
            setFilter((f) => f.slice(0, -1));
        }
        else if (filterable && !key.escape && !key.return && !key.upArrow && !key.downArrow) {
            setFilter((f) => f + input);
        }
    });
    const visible = filtered.slice(0, height);
    return (_jsxs(Box, { flexDirection: "column", children: [filterable && (_jsx(Box, { borderStyle: "round", borderColor: theme.colors.border, paddingX: 1, marginBottom: 1, children: _jsx(Text, { dimColor: !filter, children: filter || 'Type to filter…' }) })), visible.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (_jsxs(Box, { gap: 1, children: [_jsx(Text, { color: isActive ? theme.colors.primary : undefined, children: isActive ? cursor : ' ' }), _jsx(Text, { color: item.color ?? (isActive ? theme.colors.primary : theme.colors.foreground), bold: isActive, children: item.label }), item.description && (_jsx(Text, { color: theme.colors.mutedForeground, dimColor: true, children: item.description }))] }, item.key));
            }), filtered.length > height && (_jsxs(Text, { color: theme.colors.mutedForeground, dimColor: true, children: [filtered.length - height, " more\u2026"] }))] }));
}
