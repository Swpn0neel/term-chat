import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { Alert } from '../components/ui/feedback/Alert';
import { Spinner } from '../components/ui/feedback/Spinner';
import { SocialService } from '../services/socialService';
import { Title } from '../components/ui/typography/Title';
import { ClackMultiSelect } from '@/clack/prompts';

export default function RemoveFriendScreen({ user, navigate }: any) {
  const theme = useTheme();
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);

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
  }, [user.id]);

  const handleRemove = async (idsOverride?: string[]) => {
    const ids = idsOverride || selectedIds;
    if (ids.length === 0) return;

    setIsRemoving(true);
    try {
      await SocialService.removeFriends(user.id, ids);
      const nextFriends = friends.filter(f => !ids.includes(f.id));
      setFriends(nextFriends);
      setSelectedIds([]);
    } catch (err: any) {
      setError('Failed to remove friends.');
    } finally {
      setIsRemoving(false);
    }
  };

  useInput((_input, key) => {
    if (isRemoving) return;
    if (key.escape) {
      navigate('dashboard');
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Box borderStyle="single" borderColor="red" paddingX={1} marginTop={1}>
            <Text bold color="red">Remove Friends</Text>
          </Box>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        {isLoading ? (
          <Box padding={1}>
            <Spinner label="Loading friend list..." />
          </Box>
        ) : friends.length === 0 ? (
          <Box padding={1} flexDirection="column">
            <Text dimColor>Your friend list is empty.</Text>
          </Box>
        ) : (
          <Box padding={1}>
            <ClackMultiSelect 
              label="Select friends to remove"
              options={friends.map(f => ({
                label: f.username,
                value: f.id
              }))}
              value={selectedIds}
              onChange={setSelectedIds}
              onSubmit={(ids) => handleRemove(ids)}
            />
          </Box>
        )}

        {isRemoving && (
          <Box paddingX={1}>
            <Text dimColor italic>Removing selected friends...</Text>
          </Box>
        )}

        {error && (
          <Box paddingX={1}>
            <Alert variant="error">{error}</Alert>
          </Box>
        )}
      </AppShell.Content>
      <AppShell.Hints items={['Space: Toggle', 'Enter: Remove Selected', 'Esc: Back']} />
    </AppShell>
  );
}
