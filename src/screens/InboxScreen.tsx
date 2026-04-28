import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { AppShell } from '@/components/AppShell';
import { Title } from '@/components/Title';
import { Spinner } from '@/components/Spinner';
import { Alert } from '@/components/Alert';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ClackSelect } from '@/components/Menu';
import { TextInput } from '@/components/TextInput';
import { getPendingTransfers, acceptTransfer, declineTransfer } from '@/services/fileTransferService';
import { usePolling } from '@/contexts/PollingContext';
import prettyBytes from 'pretty-bytes';
import { useTheme } from '@/lib/theme';

type Stage = 'LIST' | 'ACTIONS' | 'DESTINATION' | 'DOWNLOADING' | 'DONE' | 'ERROR';

export default function InboxScreen({ user, navigate }: any) {
  const theme = useTheme();
  const { screenData, triggerImmediatePoll } = usePolling();
  const transfers = screenData?.transfers || [];
  const isLoading = !screenData?.transfers;

  const [stage, setStage] = useState<Stage>('LIST');
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [destPath, setDestPath] = useState('');
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      if (stage === 'LIST') navigate('dashboard', { initialMenu: 'files' });
      else if (stage === 'ACTIONS') setStage('LIST');
      else if (stage === 'DESTINATION') {
        setStage('ACTIONS');
        setError(null);
      }
      else if (stage === 'DONE' || stage === 'ERROR') navigate('dashboard', { initialMenu: 'files' });
    }
  });

  const handleTransferSelect = (id: string) => {
    const t = transfers.find((item: any) => item.id === id);
    setSelectedTransfer(t);
    setStage('ACTIONS');
  };

  const handleActionSelect = async (action: string) => {
    if (action === 'download') {
      setStage('DESTINATION');
    } else if (action === 'decline') {
      try {
        await declineTransfer(selectedTransfer.id);
        triggerImmediatePoll();
        setStage('LIST');
      } catch (err: any) {
        setError(`Decline failed: ${err.message}`);
        setStage('ERROR');
      }
    } else if (action === 'back') {
      setStage('LIST');
    }
  };

  const handleDestSubmit = async () => {
    setError(null);
    if (!destPath) {
      setError('Please enter a destination path.');
      return;
    }
    
    setStage('DOWNLOADING');
    try {
      const fullPath = await acceptTransfer(selectedTransfer.id, destPath, (pct, s) => {
        setProgress(pct);
        setSpeed(s);
      });
      setSavedPath(fullPath);
      setStage('DONE');
    } catch (err: any) {
      setError(`Download failed: ${err.message}`);
      setStage('DESTINATION'); // Fall back to input screen on download failure
    }
  };

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Breadcrumbs items={['Main Menu', 'File Transfer', 'File Inbox']} username={user.username} />
        </Box>
      </AppShell.Header>
      
      <AppShell.Content>
        <Box padding={1} flexDirection="column">
          {isLoading && transfers.length === 0 ? (
            <Spinner label="Checking for new files..." />
          ) : stage === 'LIST' && (
            transfers.length === 0 ? (
              <Text dimColor>No pending transfers.</Text>
            ) : (
              <ClackSelect 
                label="Select a transfer to manage"
                options={transfers.map((t: any) => ({
                  label: t.fileName,
                  value: t.id,
                  hint: `${t.sender.username} ● ${prettyBytes(t.fileSize)}`
                }))}
                onSubmit={handleTransferSelect}
              />
            )
          )}

          {stage === 'ACTIONS' && (
            <ClackSelect 
              label={`Manage ${selectedTransfer.fileName}`}
              options={[
                { label: 'Download File', value: 'download' },
                { label: 'Decline Transfer', value: 'decline' },
                { label: 'Back to List', value: 'back' }
              ]}
              onSubmit={handleActionSelect}
            />
          )}

          {stage === 'DESTINATION' && (
            <Box flexDirection="column">
              <Text bold color={theme.colors.secondary}>Enter Destination Directory Path:</Text>
              <Box gap={1}>
                <TextInput 
                  borderStyle='single'
                  value={destPath}
                  onChange={(val) => {
                    setDestPath(val);
                    if (error) setError(null);
                  }}
                  onSubmit={handleDestSubmit}
                  placeholder="e.g. /home/user/Downloads"
                  autoFocus
                />
              </Box>
              {error && (
                <Box marginTop={1}>
                  <Alert variant="error" title="Error">{error}</Alert>
                </Box>
              )}
            </Box>
          )}

          {stage === 'DOWNLOADING' && (
            <Box flexDirection="column" gap={1}>
              <Text bold color={theme.colors.secondary}>Downloading from Cloud...</Text>
              <Box gap={1}>
                <ProgressBar pct={progress} />
                <Text color={theme.colors.primary}> {progress}% <Text dimColor color={theme.colors.mutedForeground}> {speed ? `(↓ ${prettyBytes(speed)}/s)` : ""}</Text></Text>
              </Box>
              <Text color={theme.colors.mutedForeground} dimColor>{selectedTransfer.fileName}</Text>
            </Box>
          )}

          {stage === 'DONE' && (
            <Box flexDirection="column" gap={1}>
              <Alert variant="success" title="Download Complete!">
                Saved to: {savedPath}
              </Alert>
              <Box marginTop={1}>
                <Text color={theme.colors.warning}>Press Esc to go back</Text>
              </Box>
            </Box>
          )}

          {stage === 'ERROR' && (
            <Box flexDirection="column" gap={1}>
              <Alert variant="error" title="Error">
                {error}
              </Alert>
              <Box marginTop={1}>
                <Text color={theme.colors.warning}>Press Esc to go back</Text>
              </Box>
            </Box>
          )}
        </Box>
      </AppShell.Content>

      <AppShell.Hints items={['Esc: Back', 'Enter: Select']} />
    </AppShell>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const width = 20;
  const theme = useTheme();
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return (
    <Text color={theme.colors.secondary}>
      {'█'.repeat(filled)}
      <Text color={theme.colors.mutedForeground} dimColor>{'░'.repeat(empty)}</Text>
    </Text>
  );
}
