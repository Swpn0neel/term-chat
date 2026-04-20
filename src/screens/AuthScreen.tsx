import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { TextInput } from '../components/ui/input/TextInput';
import { Alert } from '../components/ui/feedback/Alert';
import { Spinner } from '../components/ui/feedback/Spinner';
import { AuthService } from '../services/authService';
import { SessionService } from '../services/sessionService';

import { Screen } from '../App';

interface AuthScreenProps {
  onAuth: (user: any) => void;
  navigate: (screen: Screen, params?: Record<string, string>) => void;
}

export default function AuthScreen({ onAuth, navigate }: AuthScreenProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeField, setActiveField] = useState<'username' | 'password'>('username');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading for session check

  // ASCII Logo (Double Line Style)
  const LOGO = `
Welcome to Term Chat ❤️                                            
  `;

  // Auto-login check on mount
  useEffect(() => {
    const checkSession = async () => {
      const savedUserId = SessionService.getSession();
      if (savedUserId) {
        try {
          const user = await AuthService.getUserById(savedUserId);
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
    if (!username || !password) {
      setError('Please fill in all fields.');
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

    if (key.upArrow || key.downArrow) {
      setActiveField(f => f === 'username' ? 'password' : 'username');
    }

    if (key.tab) {
      setMode(m => m === 'signin' ? 'signup' : 'signin');
      setError(null);
    }

    if (key.return && activeField === 'password') {
      handleSubmit();
    }
  });

  if (isLoading && !username) {
    return (
      <Box padding={2} justifyContent="center" alignItems="center">
        <Spinner label="Checking session..." />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} flexDirection="column">
        <Text color="cyan" bold>{LOGO}</Text>
        <Text color="gray" dimColor italic>     -- The Terminal Messaging Hub --</Text>
      </Box>

      <Box gap={2} marginBottom={1}>
        <Text color={mode === 'signin' ? theme.colors.primary : undefined} bold={mode === 'signin'}>
          {mode === 'signin' ? '●' : '○'} Sign In
        </Text>
        <Text color={mode === 'signup' ? theme.colors.primary : undefined} bold={mode === 'signup'}>
          {mode === 'signup' ? '●' : '○'} Sign Up
        </Text>
      </Box>

      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text color={activeField === 'username' ? theme.colors.primary : undefined}>
            Username:
          </Text>
          <TextInput 
            id="username"
            value={username}
            onChange={setUsername}
            autoFocus={activeField === 'username'}
            bordered={activeField === 'username'}
            placeholder="enter username..."
          />
        </Box>

        <Box flexDirection="column">
          <Text color={activeField === 'password' ? theme.colors.primary : undefined}>
            Password:
          </Text>
          <TextInput 
            id="password"
            value={password}
            onChange={setPassword}
            mask="*"
            autoFocus={activeField === 'password'}
            bordered={activeField === 'password'}
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

      {isLoading && (
        <Box marginTop={1} gap={1}>
          <Spinner label="Authenticating..." />
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text color={theme.colors.mutedForeground} dimColor>
          [↑/↓] Switch Field | [Tab] Toggle Mode | [Enter] Submit | [q] Quit
        </Text>
      </Box>
    </Box>
  );
}
