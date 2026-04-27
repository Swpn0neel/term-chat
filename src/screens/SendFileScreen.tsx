import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import prettyBytes from 'pretty-bytes';
import { AppShell } from '@/components/AppShell';
import { Title } from '@/components/Title';
import { Spinner } from '@/components/Spinner';
import { Alert } from '@/components/Alert';
import { ClackSelect, ClackMultiSelect } from '@/components/Menu';
import { TextInput } from '@/components/TextInput';
import { SocialService } from '@/services/socialService';
import { zipFolder, uploadToR2, createTransferRecord } from '@/services/fileTransferService';
import { generateR2Key } from '@/lib/r2';
import { useTheme } from '@/lib/theme';

type Stage = 'PATH' | 'RECIPIENTS' | 'UPLOADING' | 'DONE' | 'ERROR';

export default function SendFileScreen({ user, navigate }: any) {
  const theme = useTheme();
  const [stage, setStage] = useState<Stage>('PATH');
  const [filePath, setFilePath] = useState('');
  const [isFolder, setIsFolder] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [finalPath, setFinalPath] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [isZipping, setIsZipping] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);

  useEffect(() => {
    setIsLoadingFriends(true);
    SocialService.getFriendList(user.id)
      .then(setFriends)
      .finally(() => setIsLoadingFriends(false));
  }, [user.id]);

  useInput((_input, key) => {
    if (key.escape) {
      navigate('dashboard', { initialMenu: 'files' });
    }
  });

  const handlePathSubmit = async () => {
    setError(null);
    if (!filePath) {
      setError('Please enter a path.');
      return;
    }

    if (!fs.existsSync(filePath)) {
      setError('Path does not exist.');
      return;
    }

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      setIsFolder(true);
      setIsZipping(true);
      try {
        const zippedPath = await zipFolder(filePath);
        setFinalPath(zippedPath);
        setFileSize(fs.statSync(zippedPath).size);
        setIsZipping(false);
        setStage('RECIPIENTS');
      } catch (err: any) {
        setError(`Zipping failed: ${err.message}`);
        setIsZipping(false);
      }
    } else {
      setIsFolder(false);
      setFinalPath(filePath);
      setFileSize(stats.size);
      setStage('RECIPIENTS');
    }
  };

  const handleFriendsSubmit = async () => {
    if (selectedFriends.length === 0) return;
    setStage('UPLOADING');
    setError(null);
    try {
      const fileName = path.basename(finalPath!);
      const r2Key = generateR2Key(user.id, fileName);
      const mimeType = mime.lookup(finalPath!) || 'application/octet-stream';

      await uploadToR2(finalPath!, r2Key, mimeType, (pct, s) => {
        setProgress(pct);
        setSpeed(s);
      });

      await createTransferRecord({
        senderId: user.id,
        receiverIds: selectedFriends,
        fileName,
        fileSize,
        mimeType,
        r2Key,
      });

      setStage('DONE');
      
      if (isFolder && finalPath && finalPath.endsWith('.zip')) {
        fs.unlinkSync(finalPath);
      }

      setTimeout(() => navigate('dashboard', { initialMenu: 'files' }), 2000);
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
      setStage('ERROR');
    }
  };

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Box borderStyle="single" borderColor={theme.colors.secondary} paddingX={1} marginTop={1}>
            <Text bold>Send File</Text>
          </Box>
        </Box>
      </AppShell.Header>
      
      <AppShell.Content>
        <Box padding={1} flexDirection="column">
          {isLoadingFriends ? (
            <Box padding={1}>
              <Spinner label="Checking friend list..." />
            </Box>
          ) : friends.length === 0 ? (
            <Box flexDirection="column" gap={1}>
              <Alert variant="error" title="No Friends Found">
                You need to add friends before you can send files!
              </Alert>
              <Box marginTop={1}>
                <Text color={theme.colors.warning}>Press Esc to return to the dashboard and add some friends.</Text>
              </Box>
            </Box>
          ) : (
            <>
              {stage === 'PATH' && (
                <Box flexDirection="column">
                  <Text bold>Enter File or Folder Path:</Text>
                  <Box gap={1}>
                    <TextInput 
                      borderStyle='single'
                      value={filePath}
                      onChange={(val) => {
                        setFilePath(val);
                        if (error) setError(null);
                      }}
                      onSubmit={handlePathSubmit}
                      placeholder="e.g. /home/user/Documents"
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
            </>
          )}

          {isZipping && (
            <Box padding={1}>
              <Spinner label="Zipping folder... this may take a moment" />
            </Box>
          )}

          {stage === 'RECIPIENTS' && !isZipping && (
            <ClackMultiSelect 
              label="Select Recipients"
              options={friends.map(f => ({ label: f.username, value: f.id }))}
              value={selectedFriends}
              onChange={setSelectedFriends}
              onSubmit={handleFriendsSubmit}
            />
          )}

          {stage === 'UPLOADING' && (
            <Box flexDirection="column" gap={1}>
              <Text bold>Uploading to Cloud...</Text>
              <Box gap={1}>
                <ProgressBar pct={progress} />
                <Text> {progress}% <Text dimColor> {speed ? `(↑ ${prettyBytes(speed)}/s)` : ""}</Text></Text>
              </Box>
              <Text dimColor>{prettyBytes(fileSize)} · {path.basename(finalPath!)}</Text>
            </Box>
          )}

          {stage === 'DONE' && (
            <Box flexDirection="column" gap={1}>
              <Alert variant="success" title="Successfully Sent!">
                Recipients will be notified in their Inbox. Returning to dashboard...
              </Alert>
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

      <AppShell.Hints items={['Esc: Back', 'Enter: Confirm', 'Space: Select']}/>
    </AppShell>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const width = 20;
  const theme = useTheme();
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return (
    <Text color={theme.colors.info}>
      {'█'.repeat(filled)}
      {'░'.repeat(empty)}
    </Text>
  );
}
