import React from 'react';
import { Box, Text } from 'ink';
import { AppShell } from '../components/ui/templates/AppShell';
import { SessionService } from '../services/sessionService';
import { Title } from '../components/ui/typography/Title';
import { ClackSelect } from '@/clack/prompts';

export default function DashboardScreen({ user, navigate, unreadCount = 0, pendingCount = 0, groupUnreadCount = 0 }: any) {
  const handleSelect = (val: string) => {
    if (val === 'auth') {
      // Deliberate Sign Out
      SessionService.clearSession();
      navigate('auth');
    } else {
      navigate(val);
    }
  };

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Box borderStyle="single" borderColor="green" paddingX={1} marginTop={1}>
            <Text color="green">Logged in as: </Text>
            <Text bold>{user?.username ?? 'Guest'}</Text>
          </Box>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        <Box padding={1} flexDirection="column">
          <ClackSelect 
            label="What would you like to do?"
            options={[
              { label: 'Add Friend', value: 'add-friend' },
              { 
                label: `Friend's Chats ${unreadCount > 0 ? '●' : ''}`, 
                value: 'friend-list',
                hint: unreadCount > 0 ? `${unreadCount} new` : undefined
              },
              { 
                label: `Group Chats ${groupUnreadCount > 0 ? '●' : ''}`, 
                value: 'group-list',
                hint: groupUnreadCount > 0 ? `${groupUnreadCount} new` : undefined
              },
              { label: 'AI Chat', value: 'ai-chat' },
              { 
                label: `Pending Friend Requests ${pendingCount > 0 ? '●' : ''}`, 
                value: 'pending',
                hint: pendingCount > 0 ? `${pendingCount} new` : undefined
              },
              { label: 'Remove Friends', value: 'remove-friend' },
              { label: 'Sign Out', value: 'auth' }
            ]}
            onSubmit={handleSelect}
          />
        </Box>
      </AppShell.Content>
      <AppShell.Hints items={['Esc: Quit', '↑↓: Move', 'Enter: Select']} />
    </AppShell>
  );
}
