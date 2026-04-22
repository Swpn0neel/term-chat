import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { AppShell } from '../components/ui/templates/AppShell';
import { Select } from '../components/ui/selection/Select';
import { SocialService } from '../services/socialService';
import { GroupService } from '../services/groupService';
import { Spinner } from '../components/ui/feedback/Spinner';

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

  const handleToggleMember = (val: string) => {
    if (val === 'done') {
      handleCreate();
      return;
    }
    
    setSelectedIds(prev => {
      if (prev.includes(val)) {
        return prev.filter(id => id !== val);
      } else {
        return [...prev, val];
      }
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    
    setIsCreating(true);
    try {
      const group = await GroupService.createGroup(groupName, user.id, selectedIds);
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
        <Box paddingX={1} borderStyle="single" borderColor="green">
          <Text bold>Create New Group</Text>
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
            />
          </Box>
        ) : (
          <Box padding={1} flexDirection="column">
            {isLoading ? (
              <Spinner label="Loading friends..." />
            ) : (
              <>
                <Text>Select Friends to Add:</Text>
                <Text dimColor>(Use ↑↓ to move, Enter to toggle, select 'Finish' when done)</Text>
                <Box marginTop={1}>
                  <Select 
                    label="Friends"
                    options={[
                      { label: `✅ Finish Selection (${selectedIds.length} selected)`, value: 'done' },
                      ...friends.map(f => ({
                        label: `${selectedIds.includes(f.id) ? '☑' : '☐'} ${f.username}`,
                        value: f.id
                      }))
                    ]}
                    onSubmit={handleToggleMember}
                  />
                </Box>
              </>
            )}
          </Box>
        )}
      </AppShell.Content>
      <AppShell.Hints items={['Esc: Back', 'Enter: Select/Confirm', '↑↓: Move']} />
    </AppShell>
  );
}
