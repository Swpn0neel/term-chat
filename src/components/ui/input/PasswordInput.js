import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput, useFocus, useTheme } from 'termui';
export function PasswordInput({ value: controlledValue, onChange, onSubmit, placeholder = '', mask = '●', showToggle = false, label, id, borderStyle = 'round', paddingX = 1, width, cursor = '█', }) {
    const [internalValue, setInternalValue] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const theme = useTheme();
    const { isFocused } = useFocus({ id });
    const value = controlledValue ?? internalValue;
    function setValue(newVal) {
        onChange ? onChange(newVal) : setInternalValue(newVal);
    }
    useInput((input, key) => {
        if (!isFocused)
            return;
        // Ctrl+H toggles visibility when showToggle is enabled
        if (showToggle && input === '\x08') {
            setIsVisible((v) => !v);
            return;
        }
        if (key.return) {
            onSubmit?.(value);
            return;
        }
        if (key.backspace || key.delete) {
            setValue(value.slice(0, -1));
            return;
        }
        if (key.escape || key.upArrow || key.downArrow || key.tab)
            return;
        if (input && input.length > 0) {
            setValue(value + input);
        }
    });
    const displayValue = isVisible ? value : mask.repeat(value.length);
    const borderColor = isFocused ? theme.colors.focusRing : theme.colors.border;
    return (_jsxs(Box, { flexDirection: "column", children: [label && _jsx(Text, { bold: true, children: label }), _jsxs(Box, { flexDirection: "row", alignItems: "center", gap: 1, children: [_jsxs(Box, { borderStyle: borderStyle, borderColor: borderColor, paddingX: paddingX, width: width, children: [_jsx(Text, { color: value ? theme.colors.foreground : theme.colors.mutedForeground, children: displayValue || placeholder }), isFocused && _jsx(Text, { color: theme.colors.focusRing, children: cursor })] }), showToggle && isFocused && (_jsx(Text, { color: theme.colors.mutedForeground, children: isVisible ? 'Ctrl+H hide' : 'Ctrl+H show' }))] })] }));
}
