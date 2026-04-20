import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
export function Select({ options, value: controlledValue, onChange, onSubmit, label, cursor = '›', cursorColor, }) {
    const theme = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const resolvedCursorColor = cursorColor ?? theme.colors.primary;
    useInput((input, key) => {
        if (key.upArrow) {
            setActiveIndex((i) => {
                let next = i - 1;
                while (next >= 0 && options[next]?.disabled)
                    next--;
                return next < 0 ? i : next;
            });
        }
        else if (key.downArrow) {
            setActiveIndex((i) => {
                let next = i + 1;
                while (next < options.length && options[next]?.disabled)
                    next++;
                return next >= options.length ? i : next;
            });
        }
        else if (key.return) {
            const opt = options[activeIndex];
            if (opt && !opt.disabled) {
                onChange?.(opt.value);
                onSubmit?.(opt.value);
            }
        }
    });
    return (_jsxs(Box, { flexDirection: "column", children: [label && _jsx(Text, { bold: true, children: label }), options.map((opt, idx) => {
                const isActive = idx === activeIndex;
                const isSelected = controlledValue !== undefined && opt.value === controlledValue;
                return (_jsxs(Box, { gap: 1, children: [_jsx(Text, { color: isActive ? resolvedCursorColor : undefined, children: isActive ? cursor : ' ' }), _jsx(Text, { color: opt.disabled
                                ? theme.colors.mutedForeground
                                : isActive
                                    ? resolvedCursorColor
                                    : theme.colors.foreground, bold: isActive || isSelected, dimColor: opt.disabled, children: opt.label }), opt.hint && (_jsx(Text, { color: theme.colors.mutedForeground, dimColor: true, children: opt.hint }))] }, idx));
            })] }));
}
