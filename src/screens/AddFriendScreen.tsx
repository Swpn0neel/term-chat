import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { TextInput } from '@/components/TextInput';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { SocialService } from '@/services/socialService';
import { Title } from '@/components/Title';

export default function AddFriendScreen({ user, navigate }: any) {
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await SocialService.sendRequest(user.id, username);
      setSuccess(`Friend request sent to ${username}!`);
      setUsername('');
    } catch (err: any) {
      setError(err.message || 'Failed to send request.');
    } finally {
      setIsLoading(false);
    }
  };

  useInput((_input, key) => {
    if (key.escape) {
      navigate('dashboard', { initialMenu: 'friends' });
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Box borderStyle="single" borderColor={theme.colors.secondary} paddingX={1} marginTop={1}>
            <Text bold>Add Friend</Text>
          </Box>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        <Box padding={1} flexDirection="column">
          <Text>Enter a username to send a private friend request.</Text>
          
          <Box marginTop={1} flexDirection="column">
            <TextInput 
              label="User to invite:"
              borderStyle='single'
              value={username}
              onChange={setUsername}
              onSubmit={handleSubmit}
              placeholder="e.g. alice"
              autoFocus
            />
          </Box>

          {isLoading && (
            <Box marginTop={1}>
              <Spinner label="Sending request..." />
            </Box>
          )}

          {error && (
            <Box marginTop={1}>
              <Alert variant="error">{error}</Alert>
            </Box>
          )}

          {success && (
            <Box marginTop={1}>
              <Alert variant="success">{success}</Alert>
            </Box>
          )}
        </Box>
      </AppShell.Content>
      <AppShell.Hints items={['Esc: Back', 'Enter: Send Request']} />
    </AppShell>
  );
}
