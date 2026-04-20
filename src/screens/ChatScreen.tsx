import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { Spinner } from '../components/ui/feedback/Spinner';
import { MessageService } from '../services/messageService';
import { SocialService } from '../services/socialService';
import { prisma } from '../lib/prisma';
import { shutdown } from '../lib/shutdown';

export default function ChatScreen({ user, friendId, navigate, onRead }: any) {
  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;
  const theme = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [friend, setFriend] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const lastMessageCount = useRef(0);

  const fetchFriendInfo = useCallback(async () => {
    try {
      const data = await prisma.user.findUnique({
        where: { id: friendId },
        select: { username: true, isOnline: true, lastSeen: true }
      });
      setFriend(data);
    } catch (err) {}
  }, [friendId]);

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
    if (!userMessage || isSending) return;

    if (userMessage.toLowerCase() === '/quit') {
      await shutdown(user.id);
      return;
    }

    setIsSending(true);
    setNewMessage(''); // Clear immediately for UX

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
    if (key.escape) {
      navigate('friend-list');
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box paddingX={1} borderStyle="single" borderColor="blue" gap={1}>
          <Text bold>Chatting with: {friend?.username || '...'}</Text>
          {friend && (
            <Box>
              <Text dimColor>[ </Text>
              {(() => {
                const lastSeenDate = new Date(friend.lastSeen);
                const diffSeconds = (Date.now() - lastSeenDate.getTime()) / 1000;
                const isTrulyOnline = friend.isOnline && diffSeconds < 30;
                
                return (
                  <Text color={isTrulyOnline ? '#50fa7b' : 'gray'}>
                    {isTrulyOnline ? '● Online' : '○ Offline'}
                  </Text>
                );
              })()}
              <Text dimColor> ]</Text>
            </Box>
          )}
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        {isLoading ? (
          <Box padding={1}>
            <Spinner label="Loading conversation history..." />
          </Box>
        ) : (
          <Box flexDirection="column" paddingX={1} paddingY={1}>
            {messages.length === 0 ? (
              <Text dimColor italic>No messages yet. Say hi!</Text>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <Box key={msg.id} gap={1}>
                    <Text dimColor color="gray">[{time}]</Text>
                    <Text color={isMe ? '#50fa7b' : 'blue'} bold>
                      {isMe ? 'You' : msg.sender.username}:
                    </Text>
                    <Text>{msg.content}</Text>
                  </Box>
                );
              })
            )}
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
        borderStyle="round"
        borderColor="blue"
      />
      <AppShell.Hints items={['/quit: Close App', 'Enter: Send', 'Esc: Back']} />
    </AppShell>
  );
}
