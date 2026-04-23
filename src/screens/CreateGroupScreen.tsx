import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { AppShell } from '../components/ui/templates/AppShell';
import { SocialService } from '../services/socialService';
import { GroupService } from '../services/groupService';
import { Spinner } from '../components/ui/feedback/Spinner';
import { Title } from '../components/ui/typography/Title';
import { ClackMultiSelect } from '@/clack/prompts';

export default function CreateGroupScreen({ user, navigate }: any) {
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await SocialService.getFriendList(user.id);
        setFriends(data);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchFriends();
  }, [user.id]);

  useInput((_input, key) => {
    if (key.escape) {
      if (step === 2) {
        setStep(1);
      } else {
        navigate('group-list');
      }
    }
  });

  const handleCreate = async (ids?: string[]) => {
    if (!groupName.trim()) return;
    
    setIsCreating(true);
    try {
      const group = await GroupService.createGroup(groupName, user.id, ids || selectedIds);
      navigate('group-chat', { groupId: group.id });
    } catch (err) {
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return (
      <AppShell>
        <Box padding={1}>
          <Spinner label="Creating group..." />
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Box borderStyle="single" borderColor="green" paddingX={1} marginTop={1}>
            <Text bold>Create New Group</Text>
          </Box>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        {step === 1 ? (
          <Box padding={1} flexDirection="column">
            <Text>Enter Group Name:</Text>
            <AppShell.Input 
              value={groupName}
              onChange={setGroupName}
              onSubmit={() => {
                if (groupName.trim()) setStep(2);
              }}
              placeholder="e.g. My Awesome Group"
              borderStyle="single"
            />
          </Box>
        ) : (
          <Box padding={1} flexDirection="column">
            {isLoading ? (
              <Spinner label="Loading friends..." />
            ) : (
              <>
                  <ClackMultiSelect 
                    label="Select Friends to Add"
                    options={friends.map(f => ({
                      label: f.username,
                      value: f.id
                    }))}
                    value={selectedIds}
                    onChange={setSelectedIds}
                    onSubmit={handleCreate}
                  />
              </>
            )}
          </Box>
        )}
      </AppShell.Content>
      <AppShell.Hints items={['Esc: Back', 'Space: Toggle', 'Enter: Next/Create', '↑↓: Move']} />
    </AppShell>
  );
}
