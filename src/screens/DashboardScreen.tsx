import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { SessionService } from '@/services/sessionService';
import { Title } from '@/components/Title';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ClackSelect } from '@/components/Menu';
import { usePolling } from '@/contexts/PollingContext';
import { THEMES } from '@/lib/theme';
import { AppService } from '@/services/appService';

type MenuState = 'main' | 'friends' | 'files' | 'chats' | 'settings' | 'themes' | 'change-password';
const formatThemeName = (name: string) => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

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
  const { triggerImmediatePoll } = usePolling();
  const currentTheme = useTheme();

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
    } else if (val === 'settings') {
      setActiveMenu('settings');
    } else if (val === 'change-theme') {
      setActiveMenu('themes');
    } else if (val === 'change-password') {
      navigate('change-password');
    } else if (val.startsWith('set-theme:')) {
      const themeName = val.split(':')[1];
      AppService.updateUserTheme(user.id, themeName).then(() => {
        triggerImmediatePoll();
      }).catch(() => {});
      setActiveMenu('settings');
    } else {
      navigate(val);
    }
  };

  useInput((_input, key) => {
    if (key.escape) {
      if (activeMenu === 'main') {
        onShutdown?.();
      } else if (activeMenu === 'themes') {
        setActiveMenu('settings');
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
      case 'settings':
        return {
          label: 'Application Settings',
          options: [
            { label: 'Change App Theme', value: 'change-theme' },
            { label: 'Change Password', value: 'change-password' },
          ]
        };
      case 'themes':
        return {
          label: 'Select a theme',
          options: [
            ...Object.entries(THEMES).map(([name, theme]) => ({
              label: `${formatThemeName(name)}${name === currentTheme.name ? ' ✓' : ''}`,
              value: `set-theme:${name}`,
              hint: (
                <Box>
                  <Text color={theme.colors.primary}>● </Text>
                  <Text color={theme.colors.secondary}>● </Text>
                  <Text color={theme.colors.accent}>● </Text>
                </Box>
              )
            })),
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
            { label: 'Settings', value: 'settings' },
            { label: '', value: 'sep1', isSpacer: true },
            { label: '', value: 'sep2', isSpacer: true },
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
          <Breadcrumbs 
            items={[
              'Main Menu',
              ...(activeMenu === 'friends' ? ['Manage Friends'] : []),
              ...(activeMenu === 'files' ? ['File Transfer'] : []),
              ...(activeMenu === 'chats' ? ['Your Chats'] : []),
              ...(activeMenu === 'settings' ? ['Settings'] : []),
              ...(activeMenu === 'themes' ? ['Settings', 'Change Theme'] : []),
            ]} 
          />
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
