import React from 'react';
import { Box, Text } from 'ink';
import { AppShell } from '../components/ui/templates/AppShell';
import { Select } from '../components/ui/selection/Select';
import { SessionService } from '../services/sessionService';

export default function DashboardScreen({ user, navigate, unreadCount = 0 }: any) {
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
        <Box paddingX={1} borderStyle="single" borderColor="cyan">
          <Text bold>TermChat | Logged in as: {user?.username ?? 'Guest'}</Text>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        <Box padding={1} flexDirection="column">
          <Select 
            label="Main Menu"
            options={[
              { label: '👤 Add Friend', value: 'add-friend' },
              { label: '🔔 Pending Requests', value: 'pending' },
              { 
                label: `💬 Chat with Friends ${unreadCount > 0 ? '●' : ''}`, 
                value: 'friend-list',
                hint: unreadCount > 0 ? `${unreadCount} new` : undefined
              },
              { label: '🤖 AI Chat', value: 'ai-chat' },
              { label: '🚪 Sign Out', value: 'auth' }
            ]}
            onSubmit={handleSelect}
          />
        </Box>
      </AppShell.Content>
      <AppShell.Hints items={['q: Quit', '↑↓: Move', 'Enter: Select']} />
    </AppShell>
  );
}
