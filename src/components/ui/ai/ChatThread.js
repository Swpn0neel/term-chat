import { jsx as _jsx } from "react/jsx-runtime";
import { Box } from 'ink';
export function ChatThread({ maxHeight, autoScroll = true, children }) {
    // autoScroll is kept as a conceptual prop — in Ink's static rendering model,
    // the latest content naturally appears at the bottom. The prop is accepted for
    // API compatibility and future enhancement.
    void autoScroll;
    const containerProps = maxHeight ? { height: maxHeight, overflow: 'hidden' } : {};
    return (_jsx(Box, { flexDirection: "column", ...containerProps, children: children }));
}
