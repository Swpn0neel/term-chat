import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '@/lib/theme';

interface BreadcrumbsProps {
  items: string[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const theme = useTheme();

  return (
    <Box borderStyle="single" borderColor={theme.colors.primary} paddingX={1} marginTop={1}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <Text color={theme.colors.mutedForeground}>{' > '}</Text>
          )}
          <Text 
            bold={index === items.length - 1} 
            color={index === items.length - 1 ? theme.colors.primary : theme.colors.foreground}
          >
            {item}
          </Text>
        </React.Fragment>
      ))}
    </Box>
  );
}
