import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { SessionService } from '@/services/sessionService';
import { Title } from '@/components/Title';
import { ClackSelect } from '@/components/Menu';

type MenuState = 'main' | 'friends' | 'files' | 'chats';

export default function DashboardScreen({ 
  user, 
  navigate, 
  params = {},
  unreadCount = 0, 
  pendingCount = 0, 
  groupUnreadCount = 0, 
  fileTransferCount = 0,
  onShutdown
}: any) {
  const [activeMenu, setActiveMenu] = useState<MenuState>(params.initialMenu || 'main');

  const handleSelect = (val: string) => {
    if (val === 'auth') {
      SessionService.clearSession();
      navigate('auth');
    } else if (val === 'manage-friends') {
      setActiveMenu('friends');
    } else if (val === 'file-transfer') {
      setActiveMenu('files');
    } else if (val === 'chats') {
      setActiveMenu('chats');
    } else {
      navigate(val);
    }
  };

  useInput((_input, key) => {
    if (key.escape) {
      if (activeMenu === 'main') {
        onShutdown?.();
      } else {
        setActiveMenu('main');
      }
    }
  });

  const chatNotifications = unreadCount + groupUnreadCount;
  const friendNotifications = pendingCount;
  const fileNotifications = fileTransferCount;

  const getMenuConfig = () => {
    switch (activeMenu) {
      case 'friends':
        return {
          label: 'Want to manage your friends?',
          options: [
            { label: 'Add Friend', value: 'add-friend' },
            { label: 'Remove Friend', value: 'remove-friend' },
            { 
              label: `Pending Friend Request ${pendingCount > 0 ? '●' : ''}`, 
              value: 'pending',
              hint: pendingCount > 0 ? `${pendingCount} new` : undefined
            }
          ]
        };
      case 'files':
        return {
          label: 'Want to send/receive files?',
          options: [
            { label: 'Send File', value: 'send-file' },
            { 
              label: `File Inbox ${fileTransferCount > 0 ? '●' : ''}`, 
              value: 'inbox',
              hint: fileTransferCount > 0 ? `${fileTransferCount} pending` : undefined
            }
          ]
        };
      case 'chats':
        return {
          label: 'Whom do you want to chat with?',
          options: [
            { 
              label: `Friend's Chats ${unreadCount > 0 ? '●' : ''}`, 
              value: 'friend-list',
              hint: unreadCount > 0 ? `${unreadCount} new` : undefined
            },
            { 
              label: `Group Chats ${groupUnreadCount > 0 ? '●' : ''}`, 
              value: 'group-list',
              hint: groupUnreadCount > 0 ? `${groupUnreadCount} new` : undefined
            },
            { label: 'AI Chat', value: 'ai-chat' }
          ]
        };
      default:
        return {
          label: 'What would you like to do?',
          options: [
            { 
              label: `Your Chats ${chatNotifications > 0 ? '●' : ''}`, 
              value: 'chats',
              hint: chatNotifications > 0 ? `${chatNotifications} new` : undefined
            },
            { 
              label: `File Transfer ${fileNotifications > 0 ? '●' : ''}`, 
              value: 'file-transfer',
              hint: fileNotifications > 0 ? `${fileNotifications} pending` : undefined
            },
            { 
              label: `Manage Friends ${friendNotifications > 0 ? '●' : ''}`, 
              value: 'manage-friends',
              hint: friendNotifications > 0 ? `${friendNotifications} new` : undefined
            },
            { label: 'Sign Out', value: 'auth' }
          ]
        };
    }
  };

  const { label, options } = getMenuConfig();

  return (
    <AppShell>
      <AppShell.Header>
        <Box flexDirection="column" padding={1}>
          <Title>TermChat</Title>
          <Box borderStyle="single" borderColor="green" paddingX={1} marginTop={1}>
            <Text color="green">Logged in as: </Text>
            <Text bold>{user?.username ?? 'Guest'}</Text>
          </Box>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        <Box padding={1} flexDirection="column">
          <ClackSelect 
            key={activeMenu} // Force re-render of ClackSelect when menu changes to reset active index
            label={label}
            options={options}
            onSubmit={handleSelect}
          />
        </Box>
      </AppShell.Content>
      <AppShell.Hints items={['Esc: Back/Quit', '↑↓: Move', 'Enter: Select']} />
    </AppShell>
  );
}
