import { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput, useFocus, useTheme } from '@/lib/theme';

export interface TextInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  mask?: string;
  validate?: (value: string) => string | null;
  width?: number;
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
  width = 40,
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
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const { isFocused: internalIsFocused } = useFocus({ autoFocus, id });

  const isFocused = externalIsFocused ?? internalIsFocused;

  const value = controlledValue ?? internalValue;

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

    if (key.backspace || key.delete) {
      const newVal = value.slice(0, -1);
      onChange ? onChange(newVal) : setInternalValue(newVal);
      return;
    }

    if (key.escape) return;
    if (key.upArrow || key.downArrow || key.tab) return;

    const newVal = value + input;
    onChange ? onChange(newVal) : setInternalValue(newVal);
  });

  const displayValue = mask ? mask.repeat(value.length) : value;
  const borderColor = error
    ? theme.colors.error
    : isFocused
      ? theme.colors.focusRing
      : theme.colors.border;

  const inputContent = (
    <>
      <Text color={value ? theme.colors.foreground : theme.colors.mutedForeground}>
        {displayValue || placeholder}
      </Text>
      {isFocused && <Text color={theme.colors.focusRing}>{cursor}</Text>}
    </>
  );

  return (
    <Box flexDirection="column">
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
