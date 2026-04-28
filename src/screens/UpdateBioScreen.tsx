import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from '@/lib/theme';
import { TextInput } from '@/components/TextInput';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { AuthService } from '@/services/authService';
import { AppShell } from '@/components/AppShell';
import { Title } from '@/components/Title';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Screen } from '@/App';

interface UpdateBioScreenProps {
  user: any;
  navigate: (screen: Screen, params?: Record<string, string>) => void;
  onUpdateUser: (user: any) => void;
}

export default function UpdateBioScreen({ user, navigate, onUpdateUser }: UpdateBioScreenProps) {
  const theme = useTheme();
  const [fullName, setFullName] = useState(user.fullName || '');
  const [about, setAbout] = useState(user.about || '');
  const [birthdayStr, setBirthdayStr] = useState('');
  const [activeField, setActiveField] = useState<'fullName' | 'about' | 'birthday'>('fullName');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user.birthday) {
      const date = new Date(user.birthday);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setBirthdayStr(`${day}/${month}/${year}`);
    }
  }, [user.birthday]);

  const validateDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const year = parseInt(match[3], 10);

    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null;
    }
    return date;
  };

  const handleSubmit = async () => {
    setError(null);
    let birthdayDate: Date | null = null;
    
    if (birthdayStr) {
      birthdayDate = validateDate(birthdayStr);
      if (!birthdayDate) {
        setError('Invalid birthday format. Use dd/mm/yyyy.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const updatedUser = await AuthService.updateBio(user.id, {
        fullName,
        about,
        birthday: birthdayDate
      });
      onUpdateUser(updatedUser);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        navigate('dashboard', { initialMenu: 'settings' });
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update bio.');
    } finally {
      setIsLoading(false);
    }
  };

  useInput((input, key) => {
    if (isLoading || isSuccess) return;

    if (key.upArrow) {
      setActiveField(f => {
        if (f === 'fullName') return 'birthday';
        if (f === 'about') return 'fullName';
        return 'about';
      });
    }

    if (key.downArrow) {
      setActiveField(f => {
        if (f === 'fullName') return 'about';
        if (f === 'about') return 'birthday';
        return 'fullName';
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
          <Breadcrumbs items={['Main Menu', 'Settings', 'Update Bio']} username={user.username} />
        </Box>
      </AppShell.Header>

      <AppShell.Content>
        <Box padding={1} flexDirection="column">
          <Box flexDirection="column" gap={1} width="100%" flexGrow={1}>
            <Box flexDirection="column" flexGrow={1}>
              <Text color={activeField === 'fullName' ? theme.colors.secondary : undefined}>
                Full Name:
              </Text>
              <TextInput 
                value={fullName}
                onChange={setFullName}
                isFocused={activeField === 'fullName'}
                autoFocus={activeField === 'fullName'}
                bordered={true}
                placeholder="Your full name..."
                onSubmit={handleSubmit}
              />
            </Box>

            <Box flexDirection="column" flexGrow={1}>
              <Text color={activeField === 'about' ? theme.colors.secondary : undefined}>
                About:
              </Text>
              <TextInput 
                value={about}
                onChange={setAbout}
                isFocused={activeField === 'about'}
                bordered={true}
                placeholder="Tell us about yourself..."
                onSubmit={handleSubmit}
              />
            </Box>

            <Box flexDirection="column" flexGrow={1}>
              <Text color={activeField === 'birthday' ? theme.colors.secondary : undefined}>
                Birthday (dd/mm/yyyy):
              </Text>
              <TextInput 
                value={birthdayStr}
                onChange={setBirthdayStr}
                isFocused={activeField === 'birthday'}
                bordered={true}
                placeholder="25/12/1990"
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
              <Alert variant="success">Bio updated successfully!</Alert>
            </Box>
          )}

          {isLoading && !isSuccess && (
            <Box marginTop={1} gap={1}>
              <Spinner label="Updating bio..." />
            </Box>
          )}
        </Box>
      </AppShell.Content>

      <AppShell.Hints items={['↑/↓: Switch Field', 'Enter: Submit', 'Esc: Back to Settings']} />
    </AppShell>
  );
}
