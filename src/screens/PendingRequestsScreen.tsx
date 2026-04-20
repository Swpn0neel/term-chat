import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { Select } from '../components/ui/selection/Select';
import { Alert } from '../components/ui/feedback/Alert';
import { Spinner } from '../components/ui/feedback/Spinner';
import { SocialService } from '../services/socialService';

export default function PendingRequestsScreen({ user, navigate }: any) {
  const theme = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await SocialService.getPendingRequests(user.id);
      setRequests(data);
    } catch (err: any) {
      setError('Failed to load requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user.id]);

  const handleAction = async (action: 'ACCEPT' | 'DECLINE') => {
    const request = requests[selectedIndex];
    if (!request) return;

    setIsLoading(true);
    try {
      await SocialService.respondToRequest(request.id, action);
      // Remove from local list
      setRequests(reqs => reqs.filter(r => r.id !== request.id));
      if (selectedIndex >= requests.length - 1 && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      }
    } catch (err: any) {
      setError(`Failed to ${action.toLowerCase()} request.`);
    } finally {
      setIsLoading(false);
    }
  };

  useInput((input, key) => {
    if (isLoading) return;

    if (key.escape) {
      navigate('dashboard');
    }

    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(i => Math.min(requests.length - 1, i + 1));
    }

    if (input === 'a' || input === 'A') {
      handleAction('ACCEPT');
    }
    if (input === 'd' || input === 'D') {
      handleAction('DECLINE');
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box paddingX={1} borderStyle="single" borderColor="yellow">
          <Text bold>Pending Friend Requests</Text>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        {isLoading && requests.length === 0 ? (
          <Box padding={1}>
            <Spinner label="Loading requests..." />
          </Box>
        ) : requests.length === 0 ? (
          <Box padding={1}>
            <Text dimColor>No pending requests. Go add some friends!</Text>
          </Box>
        ) : (
          <Box flexDirection="column" padding={1}>
            <Box marginBottom={1}>
              <Text bold>Choose a request and use A (Accept) or D (Decline):</Text>
            </Box>
            {requests.map((req, idx) => {
              const isActive = idx === selectedIndex;
              return (
                <Box key={req.id} gap={1}>
                  <Text color={isActive ? theme.colors.primary : undefined}>
                    {isActive ? '›' : ' '}
                  </Text>
                  <Text color={isActive ? theme.colors.primary : undefined} bold={isActive}>
                    {req.sender.username}
                  </Text>
                  <Text dimColor>({new Date(req.createdAt).toLocaleDateString()})</Text>
                </Box>
              );
            })}
          </Box>
        )}

        {error && (
          <Box paddingX={1}>
            <Alert variant="error">{error}</Alert>
          </Box>
        )}
      </AppShell.Content>
      <AppShell.Hints items={['a: Accept', 'd: Decline', 'Esc: Back', 'q: Quit']} />
    </AppShell>
  );
}
