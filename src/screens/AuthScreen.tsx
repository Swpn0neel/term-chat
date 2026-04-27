import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from '@/lib/theme';
import { TextInput } from '@/components/TextInput';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { AuthService } from '@/services/authService';
import { SessionService } from '@/services/sessionService';
import { AppShell } from '@/components/AppShell';
import { Heading } from '@/components/Heading';  
import { Title } from '@/components/Title';
import { Screen } from '@/App';

interface AuthScreenProps {
  onAuth: (user: any) => void;
  navigate: (screen: Screen, params?: Record<string, string>) => void;
}

export default function AuthScreen({ onAuth, navigate }: AuthScreenProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeField, setActiveField] = useState<'username' | 'password' | 'confirmPassword'>('username');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading for session check

  // Auto-login check on mount
  useEffect(() => {
    const checkSession = async () => {
      const sessionData = SessionService.getSession();
      if (sessionData?.userId) {
        try {
          const user = await AuthService.getUserById(sessionData.userId);
          if (user) {
            onAuth(user);
            navigate('dashboard');
            return;
          }
        } catch (err) {
          // If session is invalid, just stay on auth screen
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const handleSubmit = async () => {
    if (!username || !password || (mode === 'signup' && !confirmPassword)) {
      setError('Please fill in all fields.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const user = await AuthService.signIn(username, password);
        onAuth(user);
        navigate('dashboard');
      } else {
        const user = await AuthService.signUp(username, password);
        onAuth(user);
        navigate('dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useInput((input, key) => {
    if (isLoading) return;

    if (key.upArrow) {
      setActiveField(f => {
        if (f === 'username') return mode === 'signup' ? 'confirmPassword' : 'password';
        if (f === 'password') return 'username';
        return 'password';
      });
    }

    if (key.downArrow) {
      setActiveField(f => {
        if (f === 'username') return 'password';
        if (f === 'password') return mode === 'signup' ? 'confirmPassword' : 'username';
        return 'username';
      });
    }

    if (key.tab) {
      setMode(m => m === 'signin' ? 'signup' : 'signin');
    }

    if (key.return) {
      handleSubmit();
    }

    if (key.escape) {
      process.exit(0);
    }
  });

  if (isLoading && !username) {
    return (
      <AppShell>
        <AppShell.Header>
          <Box flexDirection="column" padding={1}>
            <Title>TermChat</Title>
            <Box marginTop={1}>
              <Heading level={2} color={theme.colors.mutedForeground}>The Ultimate Terminal Messaging Hub</Heading>
            </Box>
          </Box>
        </AppShell.Header>
        <AppShell.Content>
          <Box padding={1}>
            <Spinner label="Checking session..." />
          </Box>
        </AppShell.Content>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Box marginTop={1}>
            <Heading level={2} color={theme.colors.mutedForeground}>The Ultimate Terminal Messaging Hub</Heading>
          </Box>
        </Box>
      </AppShell.Header>

      <AppShell.Content>
        <Box padding={1} flexDirection="column">
          <Box gap={2} marginBottom={1}>
            <Text color={mode === 'signin' ? theme.colors.secondary : undefined} bold={mode === 'signin'}>
              {mode === 'signin' ? '●' : '○'} Sign In
            </Text>
            <Text color={mode === 'signup' ? theme.colors.secondary : undefined} bold={mode === 'signup'}>
              {mode === 'signup' ? '●' : '○'} Sign Up
            </Text>
          </Box>

          <Box flexDirection="column" gap={1} width="100%">
            <Box flexDirection="column">
              <Text color={activeField === 'username' ? theme.colors.secondary : undefined}>
                Username:
              </Text>
              <TextInput 
                value={username}
                onChange={setUsername}
                isFocused={activeField === 'username'}
                autoFocus={activeField === 'username'}
                bordered={true}
                placeholder="enter username..."
                onSubmit={handleSubmit}
              />
            </Box>

            <Box flexDirection="column">
              <Text color={activeField === 'password' ? theme.colors.secondary : undefined}>
                Password:
              </Text>
              <TextInput 
                value={password}
                onChange={setPassword}
                mask="*"
                isFocused={activeField === 'password'}
                autoFocus={activeField === 'password'}
                bordered={true}
                placeholder="••••••••"
                onSubmit={handleSubmit}
              />
            </Box>

            {mode === 'signup' && (
              <Box flexDirection="column">
                <Text color={activeField === 'confirmPassword' ? theme.colors.secondary : undefined}>
                  Confirm Password:
                </Text>
                <TextInput 
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  mask="*"
                  isFocused={activeField === 'confirmPassword'}
                  autoFocus={activeField === 'confirmPassword'}
                  bordered={true}
                  placeholder="••••••••"
                  onSubmit={handleSubmit}
                />
              </Box>
            )}
          </Box>

          {error && (
            <Box marginTop={1}>
              <Alert variant="error">{error}</Alert>
            </Box>
          )}

          {isLoading && (
            <Box marginTop={1} gap={1}>
              <Spinner label="Authenticating..." />
            </Box>
          )}
        </Box>
      </AppShell.Content>

      <AppShell.Hints items={['↑/↓: Switch Field', 'Tab: Toggle Mode', 'Enter: Submit', 'Esc: Quit']} />
    </AppShell>
  );
}
