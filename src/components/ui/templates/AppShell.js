import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
function AppShellRoot({ children }) {
    return (_jsx(Box, { flexDirection: "column", flexGrow: 1, children: children }));
}
function AppShellHeader({ children }) {
    return _jsx(Box, { flexDirection: "column", children: children });
}
function AppShellTip({ children }) {
    return (_jsxs(Box, { paddingLeft: 2, paddingY: 0, children: [_jsx(Text, { dimColor: true, children: '  Tip: ' }), _jsx(Text, { dimColor: true, children: children })] }));
}
function AppShellInput({ value: controlledValue, onChange, onSubmit, placeholder = 'Type something...', borderStyle = 'single', borderColor, prefix = '>', }) {
    const [internalValue, setInternalValue] = useState('');
    const theme = useTheme();
    const value = controlledValue ?? internalValue;
    useInput((input, key) => {
        if (key.return) {
            onSubmit?.(value);
            if (!controlledValue)
                setInternalValue('');
            return;
        }
        if (key.backspace || key.delete) {
            const next = value.slice(0, -1);
            onChange ? onChange(next) : setInternalValue(next);
            return;
        }
        if (key.escape || key.upArrow || key.downArrow || key.tab)
            return;
        const next = value + input;
        onChange ? onChange(next) : setInternalValue(next);
    });
    return (_jsxs(Box, { borderStyle: borderStyle, borderColor: borderColor ?? theme.colors.border, flexDirection: "row", paddingX: 1, children: [prefix && (_jsx(Text, { color: theme.colors.primary, bold: true, children: prefix + ' ' })), _jsx(Text, { children: value || _jsx(Text, { dimColor: true, children: placeholder }) }), _jsx(Text, { color: theme.colors.focusRing, children: '█' })] }));
}
function AppShellContent({ children, height = 20, autoscroll = false }) {
    const [scrollTop, setScrollTop] = useState(0);
    // Only listen to scroll keys if explicitly enabled (to avoid fighting with Select components)
    useInput((_input, key) => {
        if (!autoscroll)
            return;
        if (key.upArrow)
            setScrollTop((s) => Math.max(0, s - 1));
        else if (key.downArrow)
            setScrollTop((s) => s + 1);
    });
    return (_jsx(Box, { flexDirection: "row", height: height, overflow: "hidden", children: _jsx(Box, { flexGrow: 1, flexDirection: "column", marginTop: -scrollTop, children: children }) }));
}
function AppShellHints({ items, children }) {
    const theme = useTheme();
    const content = items ? items.join(' | ') : children;
    return (_jsx(Box, { paddingX: 1, children: _jsx(Text, { dimColor: true, color: theme.colors.mutedForeground, children: content }) }));
}
export const AppShell = Object.assign(AppShellRoot, {
    Header: AppShellHeader,
    Tip: AppShellTip,
    Input: AppShellInput,
    Content: AppShellContent,
    Hints: AppShellHints,
});
