import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text } from 'ink';
import { useAnimation, useTheme } from 'termui';
const FRAMES = {
    dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    line: ['—', '\\', '|', '/'],
    star: ['✶', '✸', '✹', '✺', '✹', '✸'],
    clock: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'],
    bounce: ['⠁', '⠂', '⠄', '⡀', '⡈', '⠠', '⠐', '⠈'],
    bar: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█', '▉', '▊', '▋', '▌', '▍', '▎'],
    arc: ['◜', '◠', '◝', '◞', '◡', '◟'],
    arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
    toggle: ['⊶', '⊷'],
    box: ['▖', '▘', '▝', '▗'],
    pipe: ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐'],
    earth: ['🌍', '🌎', '🌏'],
};
export function Spinner({ style: spinnerStyle = 'dots', label, color, fps = 12, frames: customFrames, }) {
    const theme = useTheme();
    const frame = useAnimation(fps);
    const frames = customFrames ?? FRAMES[spinnerStyle];
    const icon = frames[frame % frames.length];
    const resolvedColor = color ?? theme.colors.primary;
    return (_jsxs(Text, { children: [_jsx(Text, { color: resolvedColor, children: icon }), label && _jsxs(Text, { children: [" ", label] })] }));
}
