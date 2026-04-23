import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { SocialService } from '@/services/socialService';
import { Title } from '@/components/Title';
import { ClackMultiSelect } from '@/components/Menu';

export default function PendingRequestsScreen({ user, navigate, onUpdate }: any) {
  const theme = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchRequests = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const data = await SocialService.getPendingRequests(user.id);
      setRequests(data);
      if (onUpdate) onUpdate(data.length);
    } catch (err: any) {
      setError(`Failed to load requests: ${err.message}`);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(true);
    const interval = setInterval(() => fetchRequests(false), 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleBulkAction = async (action: 'ACCEPT' | 'DECLINE', idsOverride?: string[]) => {
    const ids = idsOverride || selectedIds;
    if (ids.length === 0) return;

    setIsLoading(true);
    try {
      await SocialService.respondToMultipleRequests(ids, action);
      const nextRequests = requests.filter(r => !ids.includes(r.id));
      setRequests(nextRequests);
      setSelectedIds([]);
      if (onUpdate) onUpdate(nextRequests.length);
    } catch (err: any) {
      setError(`Failed to ${action.toLowerCase()} requests.`);
    } finally {
      setIsLoading(false);
    }
  };

  useInput((input, key) => {
    if (isLoading) return;

    if (key.escape) {
      navigate('dashboard');
    }

    if (input === 'd' || input === 'D') {
      handleBulkAction('DECLINE');
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Box borderStyle="single" borderColor="green" paddingX={1} marginTop={1}>
            <Text bold>Pending Requests</Text>
          </Box>
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
          <Box padding={1} flexDirection="column">
            <ClackMultiSelect 
              label="Pending Requests"
              options={requests.map(req => ({
                label: req.sender.username,
                value: req.id,
                hint: new Date(req.createdAt).toLocaleDateString()
              }))}
              value={selectedIds}
              onChange={setSelectedIds}
              onSubmit={(ids) => handleBulkAction('ACCEPT', ids)}
            />
          </Box>
        )}

        {error && (
          <Box paddingX={1}>
            <Alert variant="error">{error}</Alert>
          </Box>
        )}
      </AppShell.Content>
      <AppShell.Hints items={['Space: Toggle', 'Enter: Accept All', 'd: Decline All', 'Esc: Back']} />
    </AppShell>
  );
}
