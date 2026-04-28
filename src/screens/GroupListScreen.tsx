import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { AppShell } from '@/components/AppShell';
import { GroupService } from '@/services/groupService';
import { Spinner } from '@/components/Spinner';
import { Heading } from '@/components/Heading';
import { Title } from '@/components/Title';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ClackSelect, ClackOption } from '@/components/Menu';
import { usePolling } from '@/contexts/PollingContext';
import { useTheme } from '@/lib/theme';

export default function GroupListScreen({ user, navigate, unreadCounts = {} }: any) {
  const theme = useTheme();
  const { screenData } = usePolling();
  const groups = screenData?.groups || [];
  const isLoading = !screenData?.groups;

  const handleSelect = (val: string) => {
    if (val === 'create-new') {
      navigate('create-group');
    } else {
      navigate('group-chat', { groupId: val });
    }
  };

  const options: ClackOption[] = [
    ...groups.map((g: any) => {
      const unreadCount = unreadCounts[g.id] || 0;
      return {
        label: `${g.name}${unreadCount > 0 ? ' ●' : ''}`,
        value: g.id,
        hint: `${unreadCount > 0 ? `${unreadCount} new ● ` : ''}${g.members.length} members`
      };
    }),
    // Spacer if there are groups
    ...(groups.length > 0 ? [{ label: '', value: 'sep1', isSpacer: true }, { label: '', value: 'sep2', isSpacer: true }] : []),
    { label: 'Create New Group', value: 'create-new' }
  ];

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Breadcrumbs items={['Main Menu', 'Your Chats', 'Group Chats']} />
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        {isLoading ? (
          <Box padding={1}>
            <Spinner label="Fetching groups..." />
          </Box>
        ) : (
          <Box padding={1} flexDirection="column">
            <ClackSelect 
              label="Select a group or create one"
              options={options}
              onSubmit={handleSelect}
            />
            {groups.length === 0 && (
              <Box marginTop={1}>
                <Text dimColor italic>You haven't joined any groups yet.</Text>
              </Box>
            )}
          </Box>
        )}
      </AppShell.Content>
      <AppShell.Hints items={['Esc: Back', '↑↓: Move', 'Enter: Select']} />
    </AppShell>
  );
}
