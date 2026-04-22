import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { Select } from '../components/ui/selection/Select';
import { Alert } from '../components/ui/feedback/Alert';
import { Spinner } from '../components/ui/feedback/Spinner';
import { SocialService } from '../services/socialService';
import { Heading } from '../components/ui/typography/Heading';
import { Title } from '../components/ui/typography/Title';
import { formatLastSeen } from '../lib/dateUtils';

export default function FriendListScreen({ user, navigate, unreadCounts = {} }: any) {
  const theme = useTheme();
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = async () => {
    try {
      const data = await SocialService.getFriendList(user.id);
      setFriends(data);
    } catch (err: any) {
      setError('Failed to load friends.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    
    // Polling friends status every 5 seconds
    const interval = setInterval(fetchFriends, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  useInput((_input, key) => {
    if (key.escape) {
      navigate('dashboard');
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Box borderStyle="single" borderColor="green" paddingX={1} marginTop={1}>
            <Text bold>My Friends</Text>
          </Box>
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
            <Select 
              label="Select a friend to start chatting:"
              options={friends.map(f => {
                const lastSeenDate = new Date(f.lastSeen);
                const diffMs = Date.now() - lastSeenDate.getTime();
                const isTrulyOnline = f.isOnline && Math.abs(diffMs) < 45000;
                
                const count = unreadCounts[f.id] || 0;
                const lastSeenStr = formatLastSeen(f.lastSeen);

                return {
                  label: `💬 ${f.username} ${count > 0 ? '●' : ''}`,
                  value: f.id,
                  hint: (
                    <Text>
                      <Text color={isTrulyOnline ? '#50fa7b' : 'gray'}>
                        {isTrulyOnline ? '● Online' : `○ Offline (last seen ${lastSeenStr})`}
                      </Text>
                      {count > 0 && <Text color="yellow"> ({count} new)</Text>}
                    </Text>
                  ) as any
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
