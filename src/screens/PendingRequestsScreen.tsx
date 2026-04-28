import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { SocialService } from '@/services/socialService';
import { Title } from '@/components/Title';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ClackMultiSelect } from '@/components/Menu';
import { usePolling } from '@/contexts/PollingContext';

export default function PendingRequestsScreen({ user, navigate, onUpdate }: any) {
  const theme = useTheme();
  const { screenData, triggerImmediatePoll } = usePolling();
  const requests = screenData?.requests || [];
  const isLoading = !screenData?.requests;
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkAction = async (action: 'ACCEPT' | 'DECLINE', idsOverride?: string[]) => {
    const ids = idsOverride || selectedIds;
    if (ids.length === 0) return;

    setIsProcessing(true);
    try {
      await SocialService.respondToMultipleRequests(ids, action);
      triggerImmediatePoll();
      setSelectedIds([]);
      if (onUpdate) onUpdate(requests.length - ids.length);
    } catch (err: any) {
      setError(`Failed to ${action.toLowerCase()} requests.`);
    } finally {
      setIsProcessing(false);
    }
  };

  useInput((input, key) => {
    if (isLoading || isProcessing) return;

    if (key.escape) {
      navigate('dashboard', { initialMenu: 'friends' });
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
          <Breadcrumbs items={['Main Menu', 'Manage Friends', 'Pending Requests']} />
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
              options={requests.map((req: any) => ({
                label: req.sender.username,
                value: req.id,
                hint: `New ● ${new Date(req.createdAt).toLocaleDateString()}`
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
