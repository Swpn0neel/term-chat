import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { useTheme, useInput } from 'termui';
export function Confirm({ message, onConfirm, onCancel, confirmLabel = 'Yes', cancelLabel = 'No', defaultValue = false, variant = 'default', }) {
    const theme = useTheme();
    const [selected, setSelected] = useState(defaultValue);
    useInput((input, key) => {
        if (key.leftArrow || key.rightArrow) {
            setSelected((s) => !s);
        }
        else if (key.return) {
            if (selected) {
                onConfirm?.();
            }
            else {
                onCancel?.();
            }
        }
        else if (input === 'y' || input === 'Y') {
            onConfirm?.();
        }
        else if (input === 'n' || input === 'N') {
            onCancel?.();
        }
    });
    const yesColor = variant === 'danger' ? theme.colors.error : theme.colors.primary;
    return (_jsxs(Box, { flexDirection: "column", gap: 0, children: [_jsxs(Text, { children: [_jsx(Text, { color: theme.colors.primary, children: '? ' }), message] }), _jsxs(Box, { gap: 2, paddingLeft: 2, children: [_jsx(Box, { gap: 1, children: selected ? (_jsxs(Text, { color: yesColor, bold: true, children: ['› ', confirmLabel] })) : (_jsxs(Text, { color: theme.colors.mutedForeground, children: ['  ', confirmLabel] })) }), _jsx(Box, { gap: 1, children: !selected ? (_jsxs(Text, { bold: true, children: ['› ', cancelLabel] })) : (_jsxs(Text, { color: theme.colors.mutedForeground, children: ['  ', cancelLabel] })) })] })] }));
}
