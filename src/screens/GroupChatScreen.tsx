import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useStdout } from 'ink';
import wrapAnsi from 'wrap-ansi';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { Spinner } from '../components/ui/feedback/Spinner';
import { MessageService } from '../services/messageService';
import { GroupService } from '../services/groupService';

import { Heading } from '../components/ui/typography/Heading';

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
            
            // Get the Nth last message
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
      } catch (err: any) {
        // Maybe show error in chat as a temporary system message
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
      // Removed the immediate fetchConversation() to prevent flicker, 
      // the polling or the local state update (if we had it) would handle it.
      // Actually, keep it but ensure it doesn't trigger loading state.
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
        <Box paddingX={1} borderStyle="single" borderColor="blue" gap={1}>
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
          <Box flexDirection="column" paddingX={1} paddingY={1} width="100%" flexGrow={1}>
            {(() => {
              if (messages.length === 0) {
                return <Text dimColor italic>No messages yet. Say hi!</Text>;
              }

              const width = stdout?.columns || 100;
              const height = stdout?.rows || 24;
              const chatHeight = Math.max(5, height - 12);

              let lastDate = '';
              const allLines: React.ReactNode[] = [];

              messages.forEach((msg) => {
                const dateStr = new Date(msg.createdAt).toLocaleDateString();
                if (dateStr !== lastDate) {
                  allLines.push(<Box key={`gap-${msg.id}`} height={1} />);
                  allLines.push(
                    <Box key={`date-${msg.id}`} width="100%" justifyContent="center">
                      <Text color="gray" dimColor>── {dateStr} ──</Text>
                    </Box>
                  );
                  lastDate = dateStr;
                }

                if (msg.type === 'SYSTEM') {
                  const isJoin = msg.content.includes('added') || msg.content.includes('created');
                  const isLeave = msg.content.includes('left') || msg.content.includes('removed');
                  
                  allLines.push(
                    <Box key={msg.id} width="100%" justifyContent="center" paddingY={0}>
                      <Text color={isJoin ? '#50fa7b' : isLeave ? '#ff5555' : 'gray'} italic>
                        {msg.content}
                      </Text>
                    </Box>
                  );
                  return;
                }

                const isMe = msg.senderId === user.id;
                const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const prefix = `[${time}] ${isMe ? 'You' : msg.sender.username}: `;
                const prefixLen = prefix.length;
                
                const wrappedContent = wrapAnsi(msg.content, Math.max(10, width - prefixLen - 6), { hard: true, trim: false });
                const contentLines = wrappedContent.split('\n');

                contentLines.forEach((lineText, idx) => {
                  allLines.push(
                    <Box key={`${msg.id}-l${idx}`} flexDirection="row">
                      {idx === 0 ? (
                        <>
                          <Text dimColor color="gray">[{time}] </Text>
                          <Text color={isMe ? '#50fa7b' : 'blue'} bold>
                            {isMe ? 'You' : msg.sender.username}:
                          </Text>
                        </>
                      ) : (
                        <Text>{' '.repeat(prefixLen)}</Text>
                      )}
                      <Text> {lineText}</Text>
                    </Box>
                  );
                });
              });

              const maxLines = Math.max(1, chatHeight);
              const totalLines = allLines.length;
              const maxOffset = Math.max(0, totalLines - maxLines);
              const currentOffset = Math.min(scrollOffset, maxOffset);

              const start = Math.max(0, totalLines - maxLines - currentOffset);
              const end = totalLines - currentOffset;

              return allLines.slice(start, end);
            })()}

            {isSending && (
              <Box marginTop={1}>
                <Text dimColor italic>Sending...</Text>
              </Box>
            )}
          </Box>
        )}
      </AppShell.Content>
      <AppShell.Input
        placeholder="Type a message..."
        value={newMessage}
        onChange={setNewMessage}
        onSubmit={handleSend}
        borderStyle="single"
        borderColor="blue"
      />
      <AppShell.Hints items={[
        'Enter: Send', 
        '↑↓: Scroll', 
        'Esc: Back',
        '/delete [n|all]: Delete',
        ...(group?.creatorId === user.id ? ['/add [user]', '/remove [user]'] : []),
        '/leave'
      ]} />
    </AppShell>
  );
}
