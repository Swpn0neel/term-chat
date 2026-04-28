import React, { type ReactNode, useState, useEffect, useMemo } from 'react';
import { Box, Text, useStdout } from 'ink';
import { useInput, useTheme } from '@/lib/theme';
import { session } from '@/lib/session';

export interface AppShellProps {
  children: ReactNode;
  fullscreen?: boolean;
}

export interface AppShellHeaderProps {
  children: ReactNode;
}

export interface AppShellTipProps {
  children: ReactNode;
}

export interface AppShellInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  borderStyle?: 'single' | 'double' | 'round' | 'bold';
  borderColor?: string;
  prefix?: string;
  commands?: { name: string; description: string; value?: string }[];
  onOverlayActiveChange?: (isActive: boolean) => void;
}

export interface AppShellContentProps {
  children: ReactNode;
  autoscroll?: boolean;
  height?: number;
}

export interface AppShellHintsProps {
  items?: string[];
  children?: ReactNode;
}

function AppShellRoot({ children }: AppShellProps) {
  const { stdout } = useStdout();
  
  // Use terminal dimensions to ensure the shell fills the window
  return (
    <Box 
      flexDirection="column" 
      height={stdout?.rows ?? 24} 
      width={stdout?.columns ?? 80}
    >
      {children}
    </Box>
  );
}

function AppShellHeader({ children }: AppShellHeaderProps) {
  return <Box flexDirection="column">{children}</Box>;
}

function AppShellTip({ children }: AppShellTipProps) {
  return (
    <Box paddingLeft={2} paddingY={0}>
      <Text dimColor>{'  Tip: '}</Text>
      <Text dimColor>{children}</Text>
    </Box>
  );
}

function AppShellInput({
  value: controlledValue,
  onChange,
  onSubmit,
  placeholder = 'Type something...',
  borderStyle = 'single',
  borderColor,
  prefix = '>',
  commands = [],
  onOverlayActiveChange,
}: AppShellInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const theme = useTheme();
  const value = controlledValue ?? internalValue;

  // Sync cursor position when value changes
  useEffect(() => {
    if (cursorPosition > value.length) {
      setCursorPosition(value.length);
    }
  }, [value, cursorPosition]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeCommands = useMemo(() => {
    if (!commands || commands.length === 0 || !value.startsWith('/')) return [];
    const search = value.toLowerCase();
    return commands.filter(c => c.name.toLowerCase().startsWith(search));
  }, [commands, value]);

  const showOverlay = activeCommands.length > 0;

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeCommands.length, value.split(' ')[0]]);

  useEffect(() => {
    onOverlayActiveChange?.(showOverlay);
  }, [showOverlay, onOverlayActiveChange]);

  const MAX_VISIBLE = 5;
  const startVisibleIndex = Math.max(0, Math.min(
    selectedIndex - Math.floor(MAX_VISIBLE / 2),
    activeCommands.length - MAX_VISIBLE
  ));
  const visibleCommands = activeCommands.slice(startVisibleIndex, startVisibleIndex + MAX_VISIBLE);

  useInput((input, key) => {
    if (showOverlay) {
      if (key.upArrow) {
        setSelectedIndex(s => Math.max(0, s - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex(s => Math.min(activeCommands.length - 1, s + 1));
        return;
      }
      if (key.return || key.tab) {
        const cmd = activeCommands[selectedIndex];
        if (cmd) {
          const next = (cmd.value || cmd.name) + ' ';
          onChange ? onChange(next) : setInternalValue(next);
          setCursorPosition(next.length);
          setSelectedIndex(0);
        }
        return;
      }
    }

    if (key.return) {
      onSubmit?.(value);
      if (!controlledValue) {
        setInternalValue('');
        setCursorPosition(0);
      }
      setSelectedIndex(0);
      return;
    }

    if (key.leftArrow) {
      setCursorPosition(pos => Math.max(0, pos - 1));
      return;
    }

    if (key.rightArrow) {
      setCursorPosition(pos => Math.min(value.length, pos + 1));
      return;
    }

    if (key.backspace || key.delete || input === '\x08' || input === '\x7f') {
      if (cursorPosition > 0) {
        const next = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        onChange ? onChange(next) : setInternalValue(next);
        setCursorPosition(pos => pos - 1);
      }
      return;
    }

    if (key.escape || key.upArrow || key.downArrow || key.tab || input.charCodeAt(0) < 32) return;

    const next = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
    onChange ? onChange(next) : setInternalValue(next);
    setCursorPosition(pos => pos + input.length);
  });

  return (
    <Box flexDirection="column" width="100%" flexShrink={0}>
      {showOverlay && (
        <Box 
          flexDirection="column" 
          paddingX={1} 
          paddingY={0}
          borderStyle="single" 
          borderColor={theme.colors.border}
          borderBottom={false}
          width="100%"
        >
          {visibleCommands.map((cmd, i) => {
            const actualIndex = startVisibleIndex + i;
            const isSelected = actualIndex === selectedIndex;
            return (
              <Box key={cmd.name} flexDirection="row" width="100%" overflow="hidden">
                <Text 
                  color={isSelected ? theme.colors.background : theme.colors.foreground} 
                  backgroundColor={isSelected ? theme.colors.primary : undefined}
                  wrap="truncate-end"
                >
                  {cmd.name} 
                </Text>
                <Text 
                  color={isSelected ? theme.colors.background : theme.colors.mutedForeground} 
                  backgroundColor={isSelected ? theme.colors.primary : undefined}
                  wrap="truncate-end"
                >
                  {' '}- {cmd.description}
                </Text>
              </Box>
            );
          })}
          {activeCommands.length > MAX_VISIBLE && (
            <Box justifyContent="center" width="100%">
              <Text dimColor>
                {selectedIndex + 1} of {activeCommands.length} (↑↓ to scroll)
              </Text>
            </Box>
          )}
        </Box>
      )}
      <Box
        borderStyle={borderStyle === 'round' ? 'single' : borderStyle}
        borderColor={borderColor ?? theme.colors.border}
        flexDirection="row"
        paddingX={1}
        flexGrow={1}
      >
        {prefix && (
          <Text color={theme.colors.primary} bold>
            {prefix + ' '}
          </Text>
        )}
        <Box>
          <Text>{value.slice(0, cursorPosition)}</Text>
          <Text color={theme.colors.focusRing}>{'█'}</Text>
          <Text>{value.slice(cursorPosition) || (value === '' ? <Text dimColor>{placeholder}</Text> : '')}</Text>
        </Box>
      </Box>
    </Box>
  );
}

function AppShellContent({ children, height, autoscroll = false }: AppShellContentProps) {
  const [scrollTop, setScrollTop] = useState(0);

  // Only listen to scroll keys if explicitly enabled (to avoid fighting with Select components)
  useInput((_input, key) => {
    if (!autoscroll) return;
    if (key.upArrow) setScrollTop((s) => Math.max(0, s - 1));
    else if (key.downArrow) setScrollTop((s) => s + 1);
  });

  return (
    <Box flexDirection="row" flexGrow={1} height={height} overflow="hidden">
      <Box flexGrow={1} flexDirection="column" marginTop={-scrollTop as number}>
        {children}
      </Box>
    </Box>
  );
}

function AppShellHints({ items, children }: AppShellHintsProps) {
  const theme = useTheme();
  const [connStatus, setConnStatus] = useState(session.getConnectionStatus());
  
  useEffect(() => {
    return session.subscribeToConnection(setConnStatus);
  }, []);

  const versionStr = process.env.APP_VERSION || process.env.npm_package_version;
  const statusColor = connStatus === 'online' ? theme.colors.success : connStatus === 'slow' ? theme.colors.warning : theme.colors.error;
  
  const statusIndicator = (
    <Text>
      (<Text color={statusColor}>●</Text> {versionStr ? `v${versionStr}` : 'v1.7.5'})
    </Text>
  );

  const content = items ? items.join(' | ') : (children as string);
  
  return (
    <Box paddingX={1}>
      <Text dimColor color={theme.colors.mutedForeground}>
        {statusIndicator}{content ? ' | ' : ''}{content}
      </Text>
    </Box>
  );
}

export const AppShell = Object.assign(AppShellRoot, {
  Header: AppShellHeader,
  Tip: AppShellTip,
  Input: AppShellInput,
  Content: AppShellContent,
  Hints: AppShellHints,
});
