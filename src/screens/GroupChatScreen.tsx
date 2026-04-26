import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useStdout } from 'ink';
import wrapAnsi from 'wrap-ansi';
import { useInput, useTheme } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { Spinner } from '@/components/Spinner';
import { MessageService } from '@/services/messageService';
import { GroupService } from '@/services/groupService';

import { Heading } from '@/components/Heading';
import { formatDateSeparator } from '@/lib/dateUtils';

export default function GroupChatScreen({ user, groupId, navigate, onRead }: any) {
  const theme = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [group, setGroup] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  const { stdout } = useStdout();

  const fetchGroupInfo = useCallback(async () => {
    try {
      const data = await GroupService.getGroupDetails(groupId);
      if (!data) {
        navigate('group-list');
        return;
      }
      setGroup(data);

      // Check if user is still a member
      const isMember = data.members.some((m: any) => m.user.id === user.id);
      if (!isMember) {
        navigate('group-list');
        return;
      }

      // Calculate online members
      const count = data.members.filter((m: any) => {
        const lastSeenDate = new Date(m.user.lastSeen);
        const diffMs = Date.now() - lastSeenDate.getTime();
        return m.user.isOnline && Math.abs(diffMs) < 45000;
      }).length;
      setOnlineCount(count);
    } catch (err) {
      navigate('group-list');
    }
  }, [groupId, navigate]);

  const fetchConversation = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const data = await MessageService.getGroupConversation(groupId, user.id);
      setMessages(data);
    } catch (err) {
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [groupId, user.id]);

  useEffect(() => {
    fetchGroupInfo();
    fetchConversation(true);
    GroupService.markAsRead(groupId, user.id);
    if (onRead) onRead();

    const interval = setInterval(() => {
      fetchConversation();
      fetchGroupInfo();
      GroupService.markAsRead(groupId, user.id);
      if (onRead) onRead();
    }, 3000);

    return () => clearInterval(interval);
  }, [groupId, user.id, fetchGroupInfo, fetchConversation]);

  const handleSend = async () => {
    const userMessage = newMessage.trim();
    if (!userMessage || isSending) return;

    // Handle group commands
    if (userMessage.startsWith('/')) {
      const parts = userMessage.split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts[1];

      try {
        if (cmd === '/color' || cmd === '/changecolor' || cmd === '/changecolour') {
          await GroupService.changeMemberColor(groupId, user.id);
          await fetchGroupInfo();
          setMessages(prev => [...prev, {
            id: 'color-' + Date.now(),
            content: 'Color changed! It will take effect on your next message.',
            type: 'SYSTEM',
            createdAt: new Date(),
            sender: { username: 'System' }
          }]);
          setNewMessage('');
          return;
        }
        if (cmd === '/add' && arg) {
          if (group.creatorId !== user.id) throw new Error('Only creator can add members.');
          await GroupService.addMember(groupId, arg, user.id);
          setNewMessage('');
          await fetchConversation();
          return;
        }
        if (cmd === '/remove' && arg) {
          if (group.creatorId !== user.id) throw new Error('Only creator can remove members.');
          await GroupService.removeMember(groupId, arg, user.id);
          setNewMessage('');
          await fetchConversation();
          return;
        }
        if (cmd === '/leave') {
          await GroupService.leaveGroup(groupId, user.id);
          navigate('group-list');
          return;
        }
        if (cmd === '/delete') {
          const subArg = parts[1]?.toLowerCase();
          if (subArg === 'all') {
            await MessageService.deleteGroupMessages(user.id, groupId);
          } else {
            const n = subArg ? parseInt(subArg) : 1;
            const myMessages = messages.filter(m => m.senderId === user.id);

            const targetIndex = myMessages.length - n;

            if (targetIndex >= 0 && targetIndex < myMessages.length) {
              const msgToDelete = myMessages[targetIndex];
              await MessageService.deleteMessage(msgToDelete.id, user.id);
            }
          }
          setNewMessage('');
          await fetchConversation();
          return;
        }
        if (cmd === '/edit') {
          const parts = userMessage.split(' ');
          let n = parseInt(parts[1]);
          let newContent;

          if (isNaN(n)) {
            n = 1;
            newContent = parts.slice(1).join(' ');
          } else {
            newContent = parts.slice(2).join(' ');
          }
          
          if (newContent) {
            const myMessages = messages.filter(m => m.senderId === user.id);
            const targetIndex = myMessages.length - n;
            
            if (targetIndex >= 0 && targetIndex < myMessages.length) {
              const msgToEdit = myMessages[targetIndex];
              await MessageService.editMessage(msgToEdit.id, user.id, newContent);
            }
          }
          setNewMessage('');
          await fetchConversation();
          return;
        }
      } catch (err: any) {
        setMessages(prev => [...prev, {
          id: 'error-' + Date.now(),
          content: `Error: ${err.message}`,
          type: 'SYSTEM',
          createdAt: new Date(),
          sender: { username: 'System' }
        }]);
        setNewMessage('');
        return;
      }
    }

    setIsSending(true);
    setNewMessage('');
    setScrollOffset(0);

    try {
      await MessageService.sendGroupMessage(user.id, groupId, userMessage);
      await fetchConversation();
    } catch (err) {
      setNewMessage(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  useInput((_input, key) => {
    if (key.upArrow) {
      setScrollOffset(s => s + 1);
    } else if (key.downArrow) {
      setScrollOffset(s => Math.max(0, s - 1));
    } else if (key.escape) {
      navigate('group-list');
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box paddingX={1} borderStyle="single" borderColor="#50fa7b" gap={1}>
          <Heading level={1}>{group?.name || '...'}</Heading>
          <Box>
            <Text dimColor>[ </Text>
            <Text color="#50fa7b">{onlineCount} online</Text>
            <Text dimColor> ]</Text>
          </Box>
        </Box>
      </AppShell.Header>
      <AppShell.Content height={stdout?.rows ? Math.max(10, stdout.rows - 7) : 20}>
        {isLoading && messages.length === 0 ? (
          <Box padding={1}>
            <Spinner label="Loading conversation..." />
          </Box>
        ) : (
          <Box flexDirection="column" paddingX={1} width="100%">
            {(() => {
              if (messages.length === 0) {
                return <Text dimColor italic>No messages yet. Say hi!</Text>;
              }

              const width = stdout?.columns || 100;
              const height = stdout?.rows || 24;
              const chatHeight = Math.max(5, height - 7);

              // Build per-sender color map from group members
              // Fallback to theme.primary for null colors (backward compat with existing members)
              const senderColorMap: Record<string, string> = {};
              group?.members?.forEach((m: any) => {
                senderColorMap[m.user.id] = m.color ?? theme.colors.primary;
              });

              let lastDate = '';
              let lastSenderId = '';
              const allLines: React.ReactNode[] = [];

              messages.forEach((msg, msgIdx) => {
                const dateStr = formatDateSeparator(msg.createdAt);
                const isSameSender = msg.senderId === lastSenderId;
                
                if (dateStr !== lastDate) {
                  allLines.push(<Box key={`gap-${msg.id}`} height={1} flexShrink={0} />);
                  allLines.push(
                    <Box key={`date-${msg.id}`} width="100%" justifyContent="center" flexShrink={0}>
                      <Text color="gray" dimColor>── {dateStr} ──</Text>
                    </Box>
                  );
                  allLines.push(<Box key={`date-gap-${msg.id}`} height={1} flexShrink={0} />);
                  lastDate = dateStr;
                  lastSenderId = ''; // Reset grouping on new date
                } else if (!isSameSender && msgIdx > 0 && msg.type !== 'SYSTEM' && lastSenderId !== '') {
                  // Regular gap between different users on the same day
                  allLines.push(<Box key={`gap-${msg.id}`} height={1} flexShrink={0} />);
                }

                if (msg.type === 'SYSTEM') {
                  const isJoin = msg.content.includes('added') || msg.content.includes('created');
                  const isLeave = msg.content.includes('left') || msg.content.includes('removed');

                  allLines.push(
                    <Box key={msg.id} width="100%" justifyContent="center" paddingY={0}>
                      <Text color={isJoin ? '#50fa7b' : isLeave ? 'red' : 'gray'} italic>
                        {msg.content}
                      </Text>
                    </Box>
                  );
                  allLines.push(<Box key={`msg-gap-${msg.id}`} height={1} flexShrink={0} />);
                  lastSenderId = ''; // Reset grouping after system message
                  return;
                }

                const isMe = msg.senderId === user.id;
                const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const timePrefix = `[${time}] `;
                const indent = timePrefix.length;
                
                // Find member color
                const member = group?.members?.find((m: any) => m.userId === msg.senderId);
                const userColor = member?.color || (isMe ? '#50fa7b' : theme.colors.primary);

                const contentWidth = Math.max(10, width - indent - 4);
                
                const wrappedContent = wrapAnsi(msg.content, contentWidth, { hard: true, trim: false });
                const contentLines = wrappedContent.split('\n');

                if (msg.senderId !== lastSenderId) {
                  // New sender header
                  allLines.push(
                    <Box key={`${msg.id}-header`} flexDirection="row" flexShrink={0}>
                      <Text dimColor color="gray">{timePrefix}</Text>
                      <Text color={userColor} bold>{isMe ? 'You' : msg.sender.username}:</Text>
                    </Box>
                  );

                  // Indented message lines
                  contentLines.forEach((lineText, idx) => {
                    const isLastLine = idx === contentLines.length - 1;
                    allLines.push(
                      <Box key={`${msg.id}-l${idx}`} flexDirection="row" flexShrink={0}>
                        <Text>{' '.repeat(indent)}</Text>
                        <Text>{lineText}</Text>
                        {isLastLine && msg.isEdited && <Text dimColor italic> (edited)</Text>}
                      </Box>
                    );
                  });
                } else {
                  // Same sender - compact format
                  contentLines.forEach((lineText, idx) => {
                    const isLastLine = idx === contentLines.length - 1;
                    allLines.push(
                      <Box key={`${msg.id}-l${idx}`} flexDirection="row" flexShrink={0}>
                        {idx === 0 ? (
                          <Text dimColor color="gray">{timePrefix}</Text>
                        ) : (
                          <Text>{' '.repeat(indent)}</Text>
                        )}
                        <Text>{lineText}</Text>
                        {isLastLine && msg.isEdited && <Text dimColor italic> (edited)</Text>}
                      </Box>
                    );
                  });
                }
                
                lastSenderId = msg.senderId;
              });

              if (isSending) {
                allLines.push(
                  <Box key="sending" marginTop={0}>
                    <Text dimColor italic>Sending...</Text>
                  </Box>
                );
                allLines.push(<Box key="sending-gap" height={1} />);
              }

              const maxLines = Math.max(1, chatHeight);
              const totalLines = allLines.length;
              const maxOffset = Math.max(0, totalLines - maxLines);
              const currentOffset = Math.min(scrollOffset, maxOffset);

              const start = Math.max(0, totalLines - maxLines - currentOffset);
              const end = totalLines - currentOffset;

              return allLines.slice(start, end);
            })()}
          </Box>
        )}
      </AppShell.Content>
      <AppShell.Input
        placeholder="Type a message..."
        value={newMessage}
        onChange={setNewMessage}
        onSubmit={handleSend}
        borderStyle="single"
        borderColor="#50fa7b"
      />
      <AppShell.Hints items={[
        '/color: change color',
        '/delete [n|all]: Delete',
        '/edit [n] [msg]: Edit',
        'Enter: Send',
        '↑↓: Scroll',
        'Esc: Back',
        ...(group?.creatorId === user.id ? ['/add [user]', '/remove [user]'] : []),
        '/leave'
      ]} />
    </AppShell>
  );
}