import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import { useInput, useTheme } from '@/lib/theme';

export interface ClackOption {
  label: string;
  value: string;
  hint?: React.ReactNode;
  isSpacer?: boolean;
}

export interface ClackSelectProps {
  label: string;
  options: ClackOption[];
  onSubmit: (value: string) => void;
}

/**
 * A Clack-inspired selection component for Ink/TermUI.
 */
export const ClackSelect = ({ label, options, onSubmit }: ClackSelectProps) => {
  const [activeIndex, setActiveIndex] = useState(options.findIndex(o => !o.isSpacer) || 0);
  const theme = useTheme();
  const { stdout } = useStdout();

  useInput((input, key) => {
    if (key.upArrow) {
      setActiveIndex((prev) => {
        if (options.length === 0) return 0;
        let next = prev > 0 ? prev - 1 : options.length - 1;
        // Skip spacers
        while (options[next]?.isSpacer) {
          next = next > 0 ? next - 1 : options.length - 1;
          if (next === prev) break; // Avoid infinite loop
        }
        return next;
      });
    } else if (key.downArrow) {
      setActiveIndex((prev) => {
        if (options.length === 0) return 0;
        let next = prev < options.length - 1 ? prev + 1 : 0;
        // Skip spacers
        while (options[next]?.isSpacer) {
          next = next < options.length - 1 ? next + 1 : 0;
          if (next === prev) break; // Avoid infinite loop
        }
        return next;
      });
    } else if (key.return) {
      if (options[activeIndex] && !options[activeIndex].isSpacer) {
        onSubmit(options[activeIndex].value);
      }
    }
  });

  const rows = stdout?.rows || 24;
  const width = stdout?.columns || 80;
  // Calculate dynamic visible count based on window height
  // Reserves space for header, breadcrumbs, hints, etc.
  const VISIBLE_COUNT = Math.max(4, rows - 15);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (options.length <= VISIBLE_COUNT) {
      setStartIndex(0);
      return;
    }
    if (activeIndex < startIndex) {
      setStartIndex(activeIndex);
    } else if (activeIndex >= startIndex + VISIBLE_COUNT) {
      setStartIndex(activeIndex - VISIBLE_COUNT + 1);
    }
  }, [activeIndex, startIndex, options.length, VISIBLE_COUNT]);

  const visibleOptions = options.slice(startIndex, startIndex + VISIBLE_COUNT);

  return (
    <Box flexDirection="column" width="100%">
      {/* Question / Label */}
      <Box gap={1}>
        <Text color={theme.colors.primary} bold>◆ </Text>
        <Text bold wrap="truncate-end">{label}</Text>
      </Box>
      
      {/* Spacer vertical line */}
      <Text color={theme.colors.mutedForeground}>  │ {startIndex > 0 ? "↑" : ""}</Text>
      
      {/* Options */}
      {visibleOptions.map((option, mappedIndex) => {
        const index = startIndex + mappedIndex;
        const isActive = index === activeIndex;
        
        const optionBox = option.isSpacer ? (
          <Box key={option.value} flexDirection="row">
            <Box flexShrink={0} width={4}>
              <Text color={theme.colors.mutedForeground}>  │ </Text>
            </Box>
            <Text color={theme.colors.mutedForeground} italic dimColor wrap="truncate-end">{option.label}</Text>
          </Box>
        ) : (
          <Box key={option.value} flexDirection="row" width="100%">
            <Box flexShrink={0} width={8}>
              <Text color={theme.colors.mutedForeground}>  │ </Text>
              <Text color={isActive ? theme.colors.secondary : theme.colors.mutedForeground}>
                {isActive ? "● " : "○ "}
              </Text>
            </Box>
            <Box flexGrow={1}>
              <Text color={isActive ? theme.colors.secondary : theme.colors.mutedForeground} wrap="truncate-end">
                {option.label}
              </Text>
            </Box>
            {option.hint && width > 50 && (
              <Box flexShrink={0} marginLeft={2}>
                {typeof option.hint === 'string' || typeof option.hint === 'number' ? (
                  <Text color={theme.colors.mutedForeground} dimColor>
                    {option.hint}
                  </Text>
                ) : (
                  option.hint
                )}
              </Box>
            )}
          </Box>
        );

        return (
          <React.Fragment key={option.value}>
            {mappedIndex > 0 && <Text color={theme.colors.mutedForeground}>  │</Text>}
            {optionBox}
          </React.Fragment>
        );
      })}
      {startIndex + VISIBLE_COUNT < options.length && (
        <Text color={theme.colors.mutedForeground}>  │ ↓</Text>
      )}
    </Box>
  );
};

export interface ClackMultiSelectProps {
  label: string;
  options: ClackOption[];
  value: string[];
  onChange: (value: string[]) => void;
  onSubmit: (value: string[]) => void;
}

/**
 * A Clack-inspired multi-selection component for Ink/TermUI.
 */
export const ClackMultiSelect = ({ label, options, value, onChange, onSubmit }: ClackMultiSelectProps) => {
  const [activeIndex, setActiveIndex] = useState(options.findIndex(o => !o.isSpacer) || 0);
  const theme = useTheme();
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  useInput((input, key) => {
    if (key.upArrow) {
      setActiveIndex((prev) => {
        if (options.length === 0) return 0;
        let next = prev > 0 ? prev - 1 : options.length - 1;
        while (options[next]?.isSpacer) {
          next = next > 0 ? next - 1 : options.length - 1;
          if (next === prev) break;
        }
        return next;
      });
    } else if (key.downArrow) {
      setActiveIndex((prev) => {
        if (options.length === 0) return 0;
        let next = prev < options.length - 1 ? prev + 1 : 0;
        while (options[next]?.isSpacer) {
          next = next < options.length - 1 ? next + 1 : 0;
          if (next === prev) break;
        }
        return next;
      });
    } else if (input === ' ') {
      if (options[activeIndex] && !options[activeIndex].isSpacer) {
        const selectedValue = options[activeIndex].value;
        if (value.includes(selectedValue)) {
          onChange(value.filter((v) => v !== selectedValue));
        } else {
          onChange([...value, selectedValue]);
        }
      }
    } else if (key.return) {
      onSubmit(value);
    }
  });

  const rows = stdout?.rows || 24;
  const VISIBLE_COUNT = Math.max(3, rows - 12);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (options.length <= VISIBLE_COUNT) {
      setStartIndex(0);
      return;
    }
    if (activeIndex < startIndex) {
      setStartIndex(activeIndex);
    } else if (activeIndex >= startIndex + VISIBLE_COUNT) {
      setStartIndex(activeIndex - VISIBLE_COUNT + 1);
    }
  }, [activeIndex, startIndex, options.length, VISIBLE_COUNT]);

  const visibleOptions = options.slice(startIndex, startIndex + VISIBLE_COUNT);

  return (
    <Box flexDirection="column" width="100%">
      {/* Question / Label */}
      <Box gap={1}>
        <Text color={theme.colors.primary} bold>◆ </Text>
        <Text bold wrap="truncate-end">{label}</Text>
      </Box>
      
      {/* Spacer vertical line */}
      <Text color={theme.colors.mutedForeground}>  │ {startIndex > 0 ? "↑" : ""}</Text>
      
      {/* Options */}
      {visibleOptions.map((option, mappedIndex) => {
        const index = startIndex + mappedIndex;
        const isActive = index === activeIndex;
        const isSelected = value.includes(option.value);

        const optionBox = option.isSpacer ? (
          <Box key={option.value} flexDirection="row">
            <Box flexShrink={0} width={4}>
              <Text color={theme.colors.mutedForeground}>  │ </Text>
            </Box>
            <Text color={theme.colors.mutedForeground} italic dimColor wrap="truncate-end">{option.label}</Text>
          </Box>
        ) : (
          <Box key={option.value} flexDirection="row">
            <Box flexShrink={0} width={10}>
              <Text color={theme.colors.mutedForeground}>  │ </Text>
              <Text color={isActive ? theme.colors.secondary : theme.colors.mutedForeground}>
                {isActive ? "● " : "  "}
              </Text>
              <Text color={isSelected ? theme.colors.secondary : theme.colors.mutedForeground} key={isSelected ? 's' : 'u'}>
                {isSelected ? "◼ " : "◻ "}
              </Text>
            </Box>
            <Box flexGrow={1}>
              <Text color={isActive ? theme.colors.secondary : theme.colors.mutedForeground} wrap="truncate-end">
                {option.label}
              </Text>
            </Box>
            {option.hint && width > 50 && (
              <Box flexShrink={0} marginLeft={2}>
                {typeof option.hint === 'string' || typeof option.hint === 'number' ? (
                  <Text color={theme.colors.mutedForeground} dimColor>
                    {option.hint}
                  </Text>
                ) : (
                  option.hint
                )}
              </Box>
            )}
          </Box>
        );

        return (
          <React.Fragment key={option.value}>
            {mappedIndex > 0 && <Text color={theme.colors.mutedForeground}>  │</Text>}
            {optionBox}
          </React.Fragment>
        );
      })}
      {startIndex + VISIBLE_COUNT < options.length && (
        <Text color={theme.colors.mutedForeground}>  │ ↓</Text>
      )}
    </Box>
  );
};
