import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { SocialService } from '@/services/socialService';
import { Heading } from '@/components/Heading';
import { usePolling } from '@/contexts/PollingContext';
import { Title } from '@/components/Title';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { formatLastSeen } from '@/lib/dateUtils';
import { ClackSelect } from '@/components/Menu';

export default function FriendListScreen({ user, navigate, unreadCounts = {} }: any) {
  const theme = useTheme();
  const { screenData } = usePolling();
  const friends = screenData?.friends || [];
  const isLoading = !screenData?.friends;
  const [error, setError] = useState<string | null>(null);


  useInput((_input, key) => {
    if (key.escape) {
      navigate('dashboard', { initialMenu: 'chats' });
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Breadcrumbs items={['Main Menu', 'Your Chats', "Friend's Chats"]} username={user.username} />
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        {isLoading && friends.length === 0 ? (
          <Box padding={1}>
            <Spinner label="Loading friend list..." />
          </Box>
        ) : friends.length === 0 ? (
          <Box padding={1} flexDirection="column">
            <Text dimColor>Your friend list is empty.</Text>
            <Box marginTop={1}>
              <Text>Go to 'Add Friend' to connect with others!</Text>
            </Box>
          </Box>
        ) : (
          <Box padding={1}>
            <ClackSelect 
              label="Select a friend to start chatting"
              options={friends.map((f: any) => {
                const lastSeenDate = new Date(f.lastSeen);
                const diffMs = Date.now() - lastSeenDate.getTime();
                const isTrulyOnline = f.isOnline && Math.abs(diffMs) < 45000;
                
                const count = unreadCounts[f.id] || 0;
                const lastSeenStr = formatLastSeen(f.lastSeen);

                return {
                  label: `${f.username}${count > 0 ? ' ●' : ''}`,
                  value: f.id,
                  hint: `${count > 0 ? `${count} new ● ` : ''}${isTrulyOnline ? 'Online' : `Offline (last seen ${lastSeenStr})`}`
                };
              })}
              onSubmit={(friendId) => navigate('chat', { friendId })}
            />
          </Box>
        )}

        {error && (
          <Box paddingX={1}>
            <Alert variant="error">{error}</Alert>
          </Box>
        )}
      </AppShell.Content>
      <AppShell.Hints items={['↑↓: Move', 'Enter: Chat', 'Esc: Back']} />
    </AppShell>
  );
}
