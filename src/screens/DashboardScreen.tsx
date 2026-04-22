import React from 'react';
import { Box, Text } from 'ink';
import { AppShell } from '../components/ui/templates/AppShell';
import { Select } from '../components/ui/selection/Select';
import { SessionService } from '../services/sessionService';
import { Heading } from '../components/ui/typography/Heading';
import { Title } from '../components/ui/typography/Title';

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
            <Text bold>Logged in as: {user?.username ?? 'Guest'}</Text>
          </Box>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        <Box padding={1} flexDirection="column">
          <Select 
            label="Main Menu"
            options={[
              { label: '👤 Add Friend', value: 'add-friend' },
              { 
                label: `🔔 Pending Requests ${pendingCount > 0 ? '●' : ''}`, 
                value: 'pending',
                hint: pendingCount > 0 ? `${pendingCount} new` : undefined
              },
              { 
                label: `💬 Chat with Friends ${unreadCount > 0 ? '●' : ''}`, 
                value: 'friend-list',
                hint: unreadCount > 0 ? `${unreadCount} new` : undefined
              },
              { 
                label: `👥 Group Chats ${groupUnreadCount > 0 ? '●' : ''}`, 
                value: 'group-list',
                hint: groupUnreadCount > 0 ? `${groupUnreadCount} new` : undefined
              },
              { label: '🤖 Chat with AI', value: 'ai-chat' },
              { label: '🚪 Sign Out', value: 'auth' }
            ]}
            onSubmit={handleSelect}
          />
        </Box>
      </AppShell.Content>
      <AppShell.Hints items={['Esc: Quit', '↑↓: Move', 'Enter: Select']} />
    </AppShell>
  );
}
