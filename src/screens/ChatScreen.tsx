import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useStdout } from 'ink';
import wrapAnsi from 'wrap-ansi';
import { useInput, useTheme } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { Spinner } from '@/components/Spinner';
import { MessageService } from '@/services/messageService';
import { SocialService } from '@/services/socialService';
import { prisma } from '@/lib/prisma';

import { Heading } from '@/components/Heading';
import { formatLastSeen, formatDateSeparator } from '@/lib/dateUtils';

export default function ChatScreen({ user, friendId, navigate, onRead }: any) {
  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;
  const theme = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [friend, setFriend] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isFriend, setIsFriend] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  
  const { stdout } = useStdout();
  const lastMessageCount = useRef(0);

  const fetchFriendInfo = useCallback(async () => {
    try {
      const data = await prisma.user.findUnique({
        where: { id: friendId },
        select: { username: true, isOnline: true, lastSeen: true }
      });
      setFriend(data);
      
      const friendship = await SocialService.getFriendship(user.id, friendId);
      setIsFriend(!!friendship);
    } catch (err) {}
  }, [user.id, friendId]);

  const markRead = useCallback(async () => {
    try {
      await SocialService.markAsRead(user.id, friendId);
      onReadRef.current?.();
    } catch (err) {}
  }, [user.id, friendId]);

  const fetchConversation = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const data = await MessageService.getConversation(user.id, friendId);
      
      // If we got new messages, mark them as read
      if (data.length > lastMessageCount.current) {
        markRead();
      }
      
      lastMessageCount.current = data.length;
      setMessages(data);
    } catch (err) {
      // Silent error handle
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [user.id, friendId, markRead]);

  useEffect(() => {
    fetchFriendInfo();
    fetchConversation(true);
    markRead(); 

    // Setup Polling (3 seconds)
    const interval = setInterval(() => {
      fetchConversation();
      fetchFriendInfo();
    }, 3000);

    return () => clearInterval(interval);
  }, [friendId, fetchFriendInfo, fetchConversation, markRead]);

  const handleSend = async () => {
    const userMessage = newMessage.trim();
    if (!userMessage || isSending || !isFriend) return;



    // Handle delete commands
    if (userMessage.toLowerCase().startsWith('/delete')) {
      const parts = userMessage.split(' ');
      const arg = parts[1]?.toLowerCase();

      try {
        if (arg === 'all') {
          await MessageService.deleteConversationMessages(user.id, friendId);
        } else {
          const n = arg ? parseInt(arg) : 1;
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
      } catch (err) {
        // Silently fail or log for debug
      }
      return;
    }

    setIsSending(true);
    setNewMessage(''); // Clear immediately for UX
    setScrollOffset(0); // Scroll to bottom on send

    try {
      await MessageService.sendMessage(user.id, friendId, userMessage);
      await fetchConversation(); // Immediate refresh after send
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
      navigate('friend-list');
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box paddingX={1} borderStyle="single" borderColor="#50fa7b" gap={1}>
          <Text bold color={theme.colors.primary}>› {friend?.username || '...'}</Text>
          {friend && (
            <Box>
              <Text dimColor>[ </Text>
              {(() => {
                const lastSeenDate = new Date(friend.lastSeen);
                const diffMs = Date.now() - lastSeenDate.getTime();
                const isTrulyOnline = friend.isOnline && Math.abs(diffMs) < 45000;
                
                return (
                  <Box gap={1}>
                    <Text color={isTrulyOnline ? '#50fa7b' : 'gray'}>
                      {isTrulyOnline ? '● Online' : '○ Offline'}
                    </Text>
                    {!isTrulyOnline && (
                      <Text dimColor color="gray">
                        (Last seen: {formatLastSeen(friend.lastSeen)})
                      </Text>
                    )}
                  </Box>
                );
              })()}
              <Text dimColor> ]</Text>
            </Box>
          )}
        </Box>
      </AppShell.Header>
      <AppShell.Content height={stdout?.rows ? Math.max(10, stdout.rows - 7) : 20}>
        {isLoading && messages.length === 0 ? (
          <Box padding={1}>
            <Spinner label="Loading conversation history..." />
          </Box>
        ) : (
          <Box flexDirection="column" paddingX={1} width="100%">
            {(() => {
              if (messages.length === 0) {
                return <Text dimColor italic>No messages yet. Say hi!</Text>;
              }

              const width = stdout?.columns || 100;
              const height = stdout?.rows || 24;
              // Reserve space for header (3), footer border (1), input box (3), hints (1), paddingY (2)
              const chatHeight = Math.max(5, height - 7);

              let lastDate = '';
              const allLines: React.ReactNode[] = [];

              messages.forEach((msg) => {
                const dateStr = formatDateSeparator(msg.createdAt);
                
                if (dateStr !== lastDate) {
                  // Add a gap line and then the date separator
                  allLines.push(<Box key={`gap-${msg.id}`} height={1} flexShrink={0} />);
                  allLines.push(
                    <Box key={`date-${msg.id}`} width="100%" justifyContent="center" flexShrink={0}>
                      <Text color="gray" dimColor>── {dateStr} ──</Text>
                    </Box>
                  );
                  allLines.push(<Box key={`date-gap-${msg.id}`} height={1} flexShrink={0} />);
                  lastDate = dateStr;
                }

                const isMe = msg.senderId === user.id;
                const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const prefix = `[${time}] ${isMe ? 'You' : msg.sender.username}: `;
                const prefixLen = prefix.length;
                
                // Wrap content based on available width
                // 4 is for paddingX and border offsets
                const wrappedContent = wrapAnsi(msg.content, Math.max(10, width - prefixLen - 6), { hard: true, trim: false });
                const contentLines = wrappedContent.split('\n');

                contentLines.forEach((lineText, idx) => {
                  allLines.push(
                    <Box key={`${msg.id}-l${idx}`} flexDirection="row" flexShrink={0}>
                      {idx === 0 ? (
                        <>
                          <Text dimColor color="gray">[{time}] </Text>
                          <Text color={isMe ? '#50fa7b' : theme.colors.primary} bold>
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
                
                allLines.push(<Box key={`msg-gap-${msg.id}`} height={1} flexShrink={0} />);
              });

              if (isSending) {
                allLines.push(
                  <Box key="sending" marginTop={0}>
                    <Text dimColor italic>Sending...</Text>
                  </Box>
                );
                allLines.push(<Box key="sending-gap" height={1} />);
              }

              // Slicing logic
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
      {!isFriend ? (
        <Box padding={1} borderStyle="single" borderColor="red" justifyContent="center">
          <Text color="red" bold>You cannot message this user because you are not friends.</Text>
        </Box>
      ) : (
        <AppShell.Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={setNewMessage}
          onSubmit={handleSend}
          borderStyle="single"
          borderColor="#50fa7b"
        />
      )}
      <AppShell.Hints items={['/delete [n|all]: Delete', 'Enter: Send', '↑↓: Scroll', 'Esc: Back']} />
    </AppShell>
  );
}
