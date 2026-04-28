import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from '@/lib/theme';
import { TextInput } from '@/components/TextInput';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { AuthService } from '@/services/authService';
import { SessionService } from '@/services/sessionService';
import { AppShell } from '@/components/AppShell';
import { Title } from '@/components/Title';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Screen } from '@/App';

interface ChangePasswordScreenProps {
  user: { id: string; username: string };
  navigate: (screen: Screen, params?: Record<string, string>) => void;
}

export default function ChangePasswordScreen({ user, navigate }: ChangePasswordScreenProps) {
  const theme = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeField, setActiveField] = useState<'current' | 'new' | 'confirm'>('current');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await AuthService.changePassword(user.id, currentPassword, newPassword);
      setIsSuccess(true);
      
      // Delay navigation to show success message briefly
      setTimeout(() => {
        SessionService.clearSession();
        navigate('auth');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
      setIsLoading(false);
    }
  };

  useInput((input, key) => {
    if (isLoading || isSuccess) return;

    if (key.upArrow) {
      setActiveField(f => {
        if (f === 'current') return 'confirm';
        if (f === 'new') return 'current';
        return 'new';
      });
    }

    if (key.downArrow) {
      setActiveField(f => {
        if (f === 'current') return 'new';
        if (f === 'new') return 'confirm';
        return 'current';
      });
    }

    if (key.return) {
      handleSubmit();
    }

    if (key.escape) {
      navigate('dashboard', { initialMenu: 'settings' });
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Breadcrumbs items={['Main Menu', 'Settings', 'Change Password']} username={user.username} />
        </Box>
      </AppShell.Header>

      <AppShell.Content>
        <Box padding={1} flexDirection="column">
          
          <Box flexDirection="column" gap={1} width="100%" marginTop={1}>
            <Box flexDirection="column">
              <Text color={activeField === 'current' ? theme.colors.secondary : undefined}>
                Current Password:
              </Text>
              <TextInput 
                value={currentPassword}
                onChange={setCurrentPassword}
                mask="*"
                isFocused={activeField === 'current'}
                autoFocus={activeField === 'current'}
                bordered={true}
                placeholder="••••••••"
                onSubmit={handleSubmit}
              />
            </Box>

            <Box flexDirection="column">
              <Text color={activeField === 'new' ? theme.colors.secondary : undefined}>
                New Password:
              </Text>
              <TextInput 
                value={newPassword}
                onChange={setNewPassword}
                mask="*"
                isFocused={activeField === 'new'}
                bordered={true}
                placeholder="••••••••"
                onSubmit={handleSubmit}
              />
            </Box>

            <Box flexDirection="column">
              <Text color={activeField === 'confirm' ? theme.colors.secondary : undefined}>
                Confirm New Password:
              </Text>
              <TextInput 
                value={confirmPassword}
                onChange={setConfirmPassword}
                mask="*"
                isFocused={activeField === 'confirm'}
                bordered={true}
                placeholder="••••••••"
                onSubmit={handleSubmit}
              />
            </Box>
          </Box>

          {error && (
            <Box marginTop={1}>
              <Alert variant="error">{error}</Alert>
            </Box>
          )}

          {isSuccess && (
            <Box marginTop={1}>
              <Alert variant="success">Password changed successfully! Logging you out...</Alert>
            </Box>
          )}

          {isLoading && !isSuccess && (
            <Box marginTop={1} gap={1}>
              <Spinner label="Updating password..." />
            </Box>
          )}
        </Box>
      </AppShell.Content>

      <AppShell.Hints items={['↑/↓: Switch Field', 'Enter: Submit', 'Esc: Back to Settings']} />
    </AppShell>
  );
}
