import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput, useFocus, useTheme } from 'termui';
export function TextInput({ value: controlledValue, onChange, onSubmit, placeholder = '', mask, validate, width = 40, label, autoFocus = false, id, bordered = true, borderStyle = 'round', paddingX = 1, cursor = '█', }) {
    const [internalValue, setInternalValue] = useState('');
    const [error, setError] = useState(null);
    const theme = useTheme();
    const { isFocused } = useFocus({ autoFocus, id });
    const value = controlledValue ?? internalValue;
    useInput((input, key) => {
        if (!isFocused)
            return;
        if (key.return) {
            const err = validate ? validate(value) : null;
            if (err) {
                setError(err);
                return;
            }
            setError(null);
            onSubmit?.(value);
            return;
        }
        if (key.backspace || key.delete) {
            const newVal = value.slice(0, -1);
            onChange ? onChange(newVal) : setInternalValue(newVal);
            return;
        }
        if (key.escape)
            return;
        if (key.upArrow || key.downArrow || key.tab)
            return;
        const newVal = value + input;
        onChange ? onChange(newVal) : setInternalValue(newVal);
    });
    const displayValue = mask ? mask.repeat(value.length) : value;
    const borderColor = error
        ? theme.colors.error
        : isFocused
            ? theme.colors.focusRing
            : theme.colors.border;
    const inputContent = (_jsxs(_Fragment, { children: [_jsx(Text, { color: value ? theme.colors.foreground : theme.colors.mutedForeground, children: displayValue || placeholder }), isFocused && _jsx(Text, { color: theme.colors.focusRing, children: cursor })] }));
    return (_jsxs(Box, { flexDirection: "column", children: [label && _jsx(Text, { bold: true, children: label }), bordered ? (_jsx(Box, { borderStyle: borderStyle, borderColor: borderColor, width: width, paddingX: paddingX, children: inputContent })) : (_jsx(Box, { width: width, paddingX: paddingX, children: inputContent })), error && _jsx(Text, { color: theme.colors.error, children: error })] }));
}
