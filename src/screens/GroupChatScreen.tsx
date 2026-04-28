import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useStdout } from 'ink';
import wrapAnsi from 'wrap-ansi';
import { useInput, useTheme } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { Spinner } from '@/components/Spinner';
import { MessageService } from '@/services/messageService';
import { GroupService } from '@/services/groupService';
import { AIService } from '@/services/aiService';

import { Heading } from '@/components/Heading';
import { formatDateSeparator } from '@/lib/dateUtils';
import { usePolling } from '@/contexts/PollingContext';

export default function GroupChatScreen({ user, groupId, navigate, onRead }: any) {
  const theme = useTheme();
  const { screenData, triggerImmediatePoll } = usePolling();
  
  const group = screenData?.groupDetails;
  const messages = screenData?.messages || [];
  const isLoading = !screenData?.groupDetails;
  
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const allMessages = [...messages, ...localMessages];
  const [isSending, setIsSending] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  const { stdout } = useStdout();

  useEffect(() => {
    if (!group) return;
    // Check if user is still a member
    const isMember = group.members.some((m: any) => m.user.id === user.id);
    if (!isMember) {
      navigate('group-list');
    }
  }, [group, user.id, navigate]);

  useEffect(() => {
    if (messages.length > 0) {
      GroupService.markAsRead(groupId, user.id).catch(() => {});
      if (onRead) onRead();
    }
  }, [messages.length, groupId, user.id]);

  const onlineCount = group ? group.members.filter((m: any) => {
    const lastSeenDate = new Date(m.user.lastSeen);
    const diffMs = Date.now() - lastSeenDate.getTime();
    return m.user.isOnline && Math.abs(diffMs) < 45000;
  }).length : 0;


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
          triggerImmediatePoll();
          // We can't immediately append a system message locally unless we add it to the DB, but changeMemberColor doesn't add a system message. Wait, let's just do it optimistically.
          setNewMessage('');
          return;
        }
        if (cmd === '/add' && arg) {
          if (group.creatorId !== user.id) throw new Error('Only creator can add members.');
          await GroupService.addMember(groupId, arg, user.id);
          setNewMessage('');
          triggerImmediatePoll();
          return;
        }
        if (cmd === '/remove' && arg) {
          if (group.creatorId !== user.id) throw new Error('Only creator can remove members.');
          await GroupService.removeMember(groupId, arg, user.id);
          setNewMessage('');
          triggerImmediatePoll();
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
            const myMessages = messages.filter((m: any) => m.senderId === user.id);

            const targetIndex = myMessages.length - n;

            if (targetIndex >= 0 && targetIndex < myMessages.length) {
              const msgToDelete = myMessages[targetIndex];
              await MessageService.deleteMessage(msgToDelete.id, user.id);
            }
          }
          setNewMessage('');
          triggerImmediatePoll();
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
            const myMessages = messages.filter((m: any) => m.senderId === user.id);
            const targetIndex = myMessages.length - n;
            
            if (targetIndex >= 0 && targetIndex < myMessages.length) {
              const msgToEdit = myMessages[targetIndex];
              await MessageService.editMessage(msgToEdit.id, user.id, newContent);
            }
          }
          setNewMessage('');
          triggerImmediatePoll();
          return;
        }
      } catch (err: any) {
        setLocalMessages(prev => [...prev, {
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

    // Handle AI commands
    if (userMessage.toLowerCase().startsWith('/ai ')) {
      const prompt = userMessage.slice(4).trim();
      if (!prompt) return;

      if (!user.geminiApiKey) {
        setLocalMessages(prev => [...prev, {
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
        await MessageService.sendGroupMessage(user.id, groupId, response, true);
        triggerImmediatePoll();
      } catch (err: any) {
        setLocalMessages(prev => [...prev, {
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

    setIsSending(true);
    setNewMessage('');
    setScrollOffset(0);

    try {
      await MessageService.sendGroupMessage(user.id, groupId, userMessage);
      triggerImmediatePoll();
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
      navigate('group-list');
    }
  });

  const commands = [
    { name: '/color', description: 'change your color in chat', value: '/color' },
    { name: '/ai [prompt]', description: 'ask ai (requires gemini key)', value: '/ai' },
    { name: '/delete [n|all]', description: 'delete your messages, n = msg no', value: '/delete' },
    { name: '/edit [n] [new message]', description: 'edit your message, n = msg no', value: '/edit' },
    { name: '/leave', description: 'leave group', value: '/leave' }
  ];
  if (group?.creatorId === user.id) {
    commands.push({ name: '/add [username]', description: 'add user to group', value: '/add' });
    commands.push({ name: '/remove [username]', description: 'remove user from group', value: '/remove' });
  }

  return (
    <AppShell>
      <AppShell.Header>
        <Box paddingX={1} borderStyle="single" borderColor={theme.colors.secondary} gap={1}>
          <Heading level={1}>{group?.name || '...'}</Heading>
          <Box>
            <Text dimColor>[ </Text>
            <Text color={theme.colors.secondary}>{onlineCount} online</Text>
            <Text dimColor> ]</Text>
          </Box>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
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
                senderColorMap[m.user.id] = m.color ?? theme.colors.secondary;
              });

              let lastDate = '';
              let lastSenderId = '';
              let lastMessageType = '';
              
              const allLines: React.ReactNode[] = [];
              allMessages.forEach((msg: any, msgIdx: any) => {
                const dateStr = formatDateSeparator(msg.createdAt);
                const isSameSender = msg.senderId === lastSenderId;
                
                if (dateStr !== lastDate) {
                  if (msgIdx > 0) {
                    allLines.push(<Box key={`date-gap-pre-${msg.id}`} height={1} flexShrink={0} />);
                  }
                  allLines.push(
                    <Box key={`date-${msg.id}`} width="100%" justifyContent="center" flexShrink={0}>
                      <Text color={theme.colors.mutedForeground} dimColor>── {dateStr} ──</Text>
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
                  const isJoin = msg.content.includes('added') || msg.content.includes('created');
                  const isLeave = msg.content.includes('left') || msg.content.includes('removed');

                  allLines.push(
                    <Box key={msg.id} width="100%" justifyContent="center" paddingY={0}>
                      <Text color={isJoin ? theme.colors.success : isLeave ? theme.colors.error : theme.colors.mutedForeground} italic>
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
                
                // Find member color
                const member = group?.members?.find((m: any) => m.userId === msg.senderId);
                const userColor = member?.color || (isMe ? theme.colors.success : theme.colors.secondary);

                const isAI = msg.model === 'ai-generated';
                const suffix = (msg.isEdited ? ' (edited)' : '') + (isAI ? ' (ai-generated)' : '');
                const contentWidth = Math.max(10, width - indent - 6 - suffix.length);
                
                const displayContent = isAI ? msg.content.replace(/\n/g, ' ') : msg.content;
                const wrappedContent = wrapAnsi(displayContent, contentWidth, { hard: true, trim: false });
                const contentLines = wrappedContent.split('\n');

                if (msg.senderId !== lastSenderId) {
                  // New sender header
                  allLines.push(
                    <Box key={`${msg.id}-header`} flexDirection="row" flexShrink={0}>
                      <Text dimColor color={theme.colors.mutedForeground}>{timePrefix}</Text>
                      <Text color={userColor} bold>
                        {isMe ? 'You' : msg.sender.username}
                        {group?.creatorId === msg.senderId && <Text italic dimColor> (admin)</Text>}
                        :
                      </Text>
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
                        <Text dimColor color={theme.colors.mutedForeground}>{idx === 0 ? timePrefix : ' '.repeat(indent)}</Text>
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
        borderColor={theme.colors.secondary}
        commands={commands}
        onOverlayActiveChange={setIsOverlayActive}
      />
      <AppShell.Hints items={['enter: send', '↑↓: scroll', 'esc: back', '/: options']} />
    </AppShell>
  );
}