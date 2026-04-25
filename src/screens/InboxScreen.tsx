import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { AppShell } from '@/components/AppShell';
import { Title } from '@/components/Title';
import { Spinner } from '@/components/Spinner';
import { Alert } from '@/components/Alert';
import { ClackSelect } from '@/components/Menu';
import { TextInput } from '@/components/TextInput';
import { getPendingTransfers, acceptTransfer, declineTransfer } from '@/services/fileTransferService';
import prettyBytes from 'pretty-bytes';

type Stage = 'LIST' | 'ACTIONS' | 'DESTINATION' | 'DOWNLOADING' | 'DONE' | 'ERROR';

export default function InboxScreen({ user, navigate }: any) {
  const [stage, setStage] = useState<Stage>('LIST');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [destPath, setDestPath] = useState('');
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  const fetchTransfers = async () => {
    try {
      const list = await getPendingTransfers(user.id);
      setTransfers(list);
    } catch (err: any) {
      setError('Failed to load transfers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [user.id]);

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
    const t = transfers.find(item => item.id === id);
    setSelectedTransfer(t);
    setStage('ACTIONS');
  };

  const handleActionSelect = async (action: string) => {
    if (action === 'download') {
      setStage('DESTINATION');
    } else if (action === 'decline') {
      try {
        await declineTransfer(selectedTransfer.id);
        await fetchTransfers();
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
          <Box borderStyle="single" borderColor="#50fa7b" paddingX={1} marginTop={1}>
            <Text bold>File Inbox</Text>
          </Box>
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
                options={transfers.map(t => ({
                  label: t.fileName,
                  value: t.id,
                  hint: `${prettyBytes(t.fileSize)} from ${t.sender.username}`
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
              <Text bold>Enter Destination Directory Path:</Text>
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
              <Text bold>Downloading from Cloud...</Text>
              <Box gap={1}>
                <ProgressBar pct={progress} />
                <Text> {progress}% <Text dimColor> {speed ? `(↓ ${prettyBytes(speed)}/s)` : ""}</Text></Text>
              </Box>
              <Text dimColor>{selectedTransfer.fileName}</Text>
            </Box>
          )}

          {stage === 'DONE' && (
            <Box flexDirection="column" gap={1}>
              <Alert variant="success" title="Download Complete!">
                Saved to: {savedPath}
              </Alert>
              <Box marginTop={1}>
                <Text color="yellow">Press Esc to go back</Text>
              </Box>
            </Box>
          )}

          {stage === 'ERROR' && (
            <Box flexDirection="column" gap={1}>
              <Alert variant="error" title="Error">
                {error}
              </Alert>
              <Box marginTop={1}>
                <Text color="yellow">Press Esc to go back</Text>
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
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return (
    <Text color="cyan">
      {'█'.repeat(filled)}
      {'░'.repeat(empty)}
    </Text>
  );
}
