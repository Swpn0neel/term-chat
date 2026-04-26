import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useStdout } from 'ink';
import wrapAnsi from 'wrap-ansi';
import { useInput, useTheme } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { Spinner } from '@/components/Spinner';
import { MessageService } from '@/services/messageService';
import { SocialService } from '@/services/socialService';
import { AIService } from '@/services/aiService';
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
  const [friendship, setFriendship] = useState<any>(null);
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
      
      const fs = await SocialService.getFriendship(user.id, friendId);
      setIsFriend(!!fs);
      setFriendship(fs);
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



    // Handle AI commands
    if (userMessage.toLowerCase().startsWith('/ai ')) {
      const prompt = userMessage.slice(4).trim();
      if (!prompt) return;

      if (!user.geminiApiKey) {
        setMessages(prev => [...prev, {
          id: 'ai-error-' + Date.now(),
          content: "You haven't set your Gemini API key. Use '/set [key]' in AI Chat to enable this.",
          type: 'SYSTEM',
          createdAt: new Date(),
          sender: { username: 'System' }
        }]);
        setNewMessage('');
        return;
      }

      setIsSending(true);
      setNewMessage('');
      try {
        const instruction = 'You are TermChat AI. Your response MUST be a single paragraph of plain text ONLY. ABSOLUTELY NO markdown, no bolding, no italics, no lists, and no line breaks. Keep it concise, friendly, and readable.';
        const response = await AIService.sendChatMessage(prompt, [], user.geminiApiKey, 'gemini-2.5-flash-lite', instruction);
        await MessageService.sendMessage(user.id, friendId, response, true);
        await fetchConversation();
      } catch (err: any) {
        setMessages(prev => [...prev, {
          id: 'ai-error-' + Date.now(),
          content: `AI Error: ${err.message}`,
          type: 'SYSTEM',
          createdAt: new Date(),
          sender: { username: 'System' }
        }]);
      } finally {
        setIsSending(false);
      }
      return;
    }

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

    // Handle edit commands
    if (userMessage.toLowerCase().startsWith('/edit')) {
      const parts = userMessage.split(' ');
      let n = parseInt(parts[1]);
      let newContent;

      if (isNaN(n)) {
        n = 1;
        newContent = parts.slice(1).join(' ');
      } else {
        newContent = parts.slice(2).join(' ');
      }
      
      try {
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
      } catch (err) {}
      return;
    }

    // Handle color commands
    if (userMessage.startsWith('/')) {
      const parts = userMessage.split(' ');
      const cmd = parts[0].toLowerCase();
      if (cmd === '/color' || cmd === '/changecolor' || cmd === '/changecolour') {
        try {
          await SocialService.changeFriendColor(user.id, friendId);
          await fetchFriendInfo();
          setMessages(prev => [...prev, {
            id: 'color-' + Date.now(),
            content: 'Color changed! It will take effect on your next message.',
            type: 'SYSTEM',
            createdAt: new Date(),
            sender: { username: 'System' }
          }]);
          setNewMessage('');
        } catch (err: any) {}
        return;
      }
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

  const [isOverlayActive, setIsOverlayActive] = useState(false);

  useInput((_input, key) => {
    if (isOverlayActive) return;
    if (key.upArrow) {
      setScrollOffset(s => s + 1);
    } else if (key.downArrow) {
      setScrollOffset(s => Math.max(0, s - 1));
    } else if (key.escape) {
      navigate('friend-list');
    }
  });

  const commands = [
    { name: '/color', description: 'change your color in chat', value: '/color' },
    { name: '/ai [prompt]', description: 'ask ai (requires gemini key)', value: '/ai' },
    { name: '/delete [n|all]', description: 'delete your messages, n = msg no', value: '/delete' },
    { name: '/edit [n] [new message]', description: 'edit your message, n = msg no', value: '/edit' }
  ];

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
      <AppShell.Content>
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
              let lastSenderId = '';
              let lastMessageType = '';
              
              const allLines: React.ReactNode[] = [];

              messages.forEach((msg, msgIdx) => {
                const dateStr = formatDateSeparator(msg.createdAt);
                const isSameSender = msg.senderId === lastSenderId;
                
                if (dateStr !== lastDate) {
                  if (msgIdx > 0) {
                    allLines.push(<Box key={`date-gap-pre-${msg.id}`} height={1} flexShrink={0} />);
                  }
                  allLines.push(
                    <Box key={`date-${msg.id}`} width="100%" justifyContent="center" flexShrink={0}>
                      <Text color="gray" dimColor>── {dateStr} ──</Text>
                    </Box>
                  );
                  allLines.push(<Box key={`date-gap-${msg.id}`} height={1} flexShrink={0} />);
                  lastDate = dateStr;
                  lastSenderId = ''; // Reset grouping on new date
                  lastMessageType = '';
                } else if (msg.type !== 'SYSTEM' && lastMessageType !== 'SYSTEM' && !isSameSender && msgIdx > 0) {
                  // Regular gap between different users on the same day
                  allLines.push(<Box key={`gap-${msg.id}`} height={1} flexShrink={0} />);
                } else if (msg.type !== 'SYSTEM' && lastMessageType === 'SYSTEM') {
                  // Gap between system and user message
                  allLines.push(<Box key={`sys-user-gap-${msg.id}`} height={1} flexShrink={0} />);
                } else if (msg.type === 'SYSTEM' && lastMessageType !== 'SYSTEM' && msgIdx > 0) {
                  // Gap between user and system message
                  allLines.push(<Box key={`user-sys-gap-${msg.id}`} height={1} flexShrink={0} />);
                }

                if (msg.type === 'SYSTEM') {
                  allLines.push(
                    <Box key={msg.id} width="100%" justifyContent="center" paddingY={0}>
                      <Text color="gray" italic>
                        {msg.content}
                      </Text>
                    </Box>
                  );
                  lastSenderId = ''; // Reset grouping after system message
                  lastMessageType = 'SYSTEM';
                  return;
                }
                
                lastMessageType = 'USER';

                const isMe = msg.senderId === user.id;
                const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const timePrefix = `[${time}] `;
                const indent = timePrefix.length;
                
                // Colors
                const isMeSender = friendship?.senderId === user.id;
                const myColor = (isMeSender ? friendship?.senderColor : friendship?.receiverColor) || '#50fa7b';
                const friendColor = (isMeSender ? friendship?.receiverColor : friendship?.senderColor) || theme.colors.primary;
                const userColor = isMe ? myColor : friendColor;

                const isAI = msg.model === 'ai-generated';
                const suffix = (msg.isEdited ? ' (edited)' : '') + (isAI ? ' (ai-generated)' : '');
                const contentWidth = Math.max(10, width - indent - 6 - suffix.length);
                
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
                        {isLastLine && isAI && <Text dimColor italic> (ai-generated)</Text>}
                      </Box>
                    );
                  });
                } else {
                  // Same sender - compact format
                  contentLines.forEach((lineText, idx) => {
                    const isLastLine = idx === contentLines.length - 1;
                    allLines.push(
                      <Box key={`${msg.id}-l${idx}`} flexDirection="row" flexShrink={0}>
                        <Text dimColor color="gray">{idx === 0 ? timePrefix : ' '.repeat(indent)}</Text>
                        <Text>{lineText}</Text>
                        {isLastLine && msg.isEdited && <Text dimColor italic> (edited)</Text>}
                        {isLastLine && isAI && <Text dimColor italic> (ai-generated)</Text>}
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
          commands={commands}
          onOverlayActiveChange={setIsOverlayActive}
        />
      )}
      <AppShell.Hints items={['enter: ask', '↑↓: scroll', 'esc: back', '/: options menu']} />
    </AppShell>
  );
}
