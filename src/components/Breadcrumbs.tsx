import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { useTheme } from '@/lib/theme';

interface BreadcrumbsProps {
  items: string[];
  username?: string;
}

export function Breadcrumbs({ items, username }: BreadcrumbsProps) {
  const theme = useTheme();
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  // Responsive logic: if screen is narrow, collapse breadcrumbs
  const displayItems = width < 60 && items.length > 2
    ? ['...', items[items.length - 1]]
    : items;

  return (
    <Box borderStyle="single" borderColor={theme.colors.primary} paddingX={1} width="100%" justifyContent="space-between" marginTop={1}>
      <Box>
        {displayItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <Text color={theme.colors.mutedForeground}>{' > '}</Text>
            )}
            <Text 
              bold={index === displayItems.length - 1} 
              color={index === displayItems.length - 1 ? theme.colors.primary : theme.colors.foreground}
            >
              {item}
            </Text>
          </React.Fragment>
        ))}
      </Box>
      
      {username && (
        <Box>
          <Text color={theme.colors.mutedForeground} bold>{username}</Text>
        </Box>
      )}
    </Box>
  );
}
