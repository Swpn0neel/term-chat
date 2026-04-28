import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useFocus, useTheme } from '@/lib/theme';

export interface TextInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  mask?: string;
  validate?: (value: string) => string | null;
  width?: number | string;
  label?: string;
  autoFocus?: boolean;
  id?: string;
  /** Manually control focus state. If provided, overrides internal focus logic. */
  isFocused?: boolean;
  /** Show a border around the input. Default: true */
  bordered?: boolean;
  /** Border style. Default: 'round' */
  borderStyle?:
    | 'single'
    | 'double'
    | 'round'
    | 'bold'
    | 'singleDouble'
    | 'doubleSingle'
    | 'classic';
  /** Horizontal padding. Default: 1 */
  paddingX?: number;
  /** Cursor character shown when focused. Default: '█' */
  cursor?: string;
}

export function TextInput({
  value: controlledValue,
  onChange,
  onSubmit,
  placeholder = '',
  mask,
  validate,
  width = '100%',
  label,
  autoFocus = false,
  id,
  isFocused: externalIsFocused,
  bordered = true,
  borderStyle = 'single',
  paddingX = 1,
  cursor = '█',
}: TextInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const { isFocused: internalIsFocused } = useFocus({ autoFocus, id });

  const isFocused = externalIsFocused ?? internalIsFocused;

  const value = controlledValue ?? internalValue;

  // Move cursor to end when focused
  useEffect(() => {
    if (isFocused) {
      setCursorPosition(value.length);
    }
  }, [isFocused]);

  // Sync cursor position when value changes externally if it's beyond the new length
  if (cursorPosition > value.length) {
    setCursorPosition(value.length);
  }

  useInput((input, key) => {
    if (!isFocused) return;

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

    if (key.leftArrow) {
      setCursorPosition((pos) => Math.max(0, pos - 1));
      return;
    }

    if (key.rightArrow) {
      setCursorPosition((pos) => Math.min(value.length, pos + 1));
      return;
    }

    // Handle backspace and delete (including common Windows/Linux control characters)
    if (key.backspace || key.delete || input === '\x08' || input === '\x7f') {
      if (cursorPosition > 0) {
        const newVal = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        onChange ? onChange(newVal) : setInternalValue(newVal);
        setCursorPosition((pos) => pos - 1);
      }
      return;
    }

    // Ignore other control characters (e.g. arrows, escape) and escape sequences
    if (key.escape || key.upArrow || key.downArrow || key.tab || input.charCodeAt(0) < 32) return;

    const newVal = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
    onChange ? onChange(newVal) : setInternalValue(newVal);
    setCursorPosition((pos) => pos + input.length);
  });

  const displayValue = mask ? mask.repeat(value.length) : value;
  const borderColor = error
    ? theme.colors.error
    : isFocused
      ? theme.colors.focusRing
      : theme.colors.border;

  const beforeCursor = displayValue.slice(0, cursorPosition);
  const afterCursor = displayValue.slice(cursorPosition);

  const inputContent = (
    <Box>
      <Text color={value ? theme.colors.foreground : theme.colors.mutedForeground}>
        {beforeCursor}
      </Text>
      {isFocused && <Text color={theme.colors.focusRing}>{cursor}</Text>}
      <Text color={value ? theme.colors.foreground : theme.colors.mutedForeground}>
        {afterCursor || (value === '' ? placeholder : '')}
      </Text>
    </Box>
  );

  return (
    <Box flexDirection="column" width={width} flexGrow={1}>
      {label && <Text bold>{label}</Text>}
      {bordered ? (
        <Box borderStyle={borderStyle} borderColor={borderColor} width={width} paddingX={paddingX}>
          {inputContent}
        </Box>
      ) : (
        <Box width={width} paddingX={paddingX}>
          {inputContent}
        </Box>
      )}
      {error && <Text color={theme.colors.error}>{error}</Text>}
    </Box>
  );
}
