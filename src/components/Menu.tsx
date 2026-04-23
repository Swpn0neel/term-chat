import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';

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

  return (
    <Box flexDirection="column">
      {/* Question / Label */}
      <Box gap={1}>
        <Text color={theme.colors.primary} bold>◆ </Text>
        <Text bold>{label}</Text>
      </Box>
      
      {/* Spacer vertical line */}
      <Text color="gray">  │</Text>
      
      {/* Options */}
      {options.map((option, index) => {
        const isActive = index === activeIndex;
        
        if (option.isSpacer) {
          return (
            <Box key={option.value} gap={1}>
              <Text color="gray">  │</Text>
              <Text color="gray">  </Text>
              <Text color="gray" italic dimColor>{option.label}</Text>
            </Box>
          );
        }

        return (
          <Box key={option.value} gap={1}>
            <Text color="gray">  │</Text>
            <Text color={isActive ? theme.colors.primary : "gray"}>
              {isActive ? "●" : "○"}
            </Text>
            <Text color={isActive ? "#50fa7b" : "gray"}>
              {option.label}
            </Text>
            {option.hint && (
              <Box gap={1}>
                {typeof option.hint === 'string' ? (
                  <Text color="gray" dimColor>
                    {isActive ? `— ${option.hint}` : `(${option.hint})`}
                  </Text>
                ) : (
                  <Box gap={1}>
                    {isActive && <Text color="gray">—</Text>}
                    {option.hint}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      })}
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

  return (
    <Box flexDirection="column">
      {/* Question / Label */}
      <Box gap={1}>
        <Text color={theme.colors.primary} bold>◆ </Text>
        <Text bold>{label}</Text>
      </Box>
      
      {/* Spacer vertical line */}
      <Text color="gray">  │</Text>
      
      {/* Options */}
      {options.map((option, index) => {
        const isActive = index === activeIndex;

        if (option.isSpacer) {
          return (
            <Box key={option.value} gap={1}>
              <Text color="gray">  │</Text>
              <Text color="gray">    </Text>
              <Text color="gray" italic dimColor>{option.label}</Text>
            </Box>
          );
        }

        const isSelected = value.includes(option.value);
        return (
          <Box key={option.value} gap={1}>
            <Text color="gray">  │</Text>
            <Text color={isActive ? theme.colors.primary : "gray"}>
              {isActive ? "●" : " "}
            </Text>
            <Text color={isSelected ? theme.colors.primary : "gray"}>
              {isSelected ? "◼" : "◻"}
            </Text>
            <Text color={isActive ? "#50fa7b" : "gray"}>
              {option.label}
            </Text>
            {option.hint && (
              <Box gap={1}>
                {typeof option.hint === 'string' ? (
                  <Text color="gray" dimColor>
                    {isActive ? `— ${option.hint}` : `(${option.hint})`}
                  </Text>
                ) : (
                  <Box gap={1}>
                    {isActive && <Text color="gray">—</Text>}
                    {option.hint}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
