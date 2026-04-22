import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { AppShell } from '../components/ui/templates/AppShell';
import { Select } from '../components/ui/selection/Select';
import { GroupService } from '../services/groupService';
import { Spinner } from '../components/ui/feedback/Spinner';

export default function GroupListScreen({ user, navigate }: any) {
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const data = await GroupService.getGroupsForUser(user.id);
      setGroups(data);
    } catch (err) {
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups(true);
    const interval = setInterval(() => fetchGroups(false), 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleSelect = (val: string) => {
    if (val === 'create-new') {
      navigate('create-group');
    } else {
      navigate('group-chat', { groupId: val });
    }
  };

  const options = [
    { label: '➕ Create New Group', value: 'create-new' },
    ...groups.map(g => ({
      label: `👥 ${g.name}`,
      value: g.id,
      hint: `${g.members.length} members`
    }))
  ];

  return (
    <AppShell>
      <AppShell.Header>
        <Box paddingX={1} borderStyle="single" borderColor="cyan">
          <Text bold>Your Group Chats</Text>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        {isLoading ? (
          <Box padding={1}>
            <Spinner label="Fetching groups..." />
          </Box>
        ) : (
          <Box padding={1} flexDirection="column">
            <Select 
              label="Groups"
              options={options}
              onSubmit={handleSelect}
            />
            {groups.length === 0 && (
              <Box marginTop={1}>
                <Text dimColor italic>You haven't joined any groups yet.</Text>
              </Box>
            )}
          </Box>
        )}
      </AppShell.Content>
      <AppShell.Hints items={['Esc: Back', '↑↓: Move', 'Enter: Select']} />
    </AppShell>
  );
}
