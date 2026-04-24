import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Text, useStdout } from 'ink';
import wrapAnsi from 'wrap-ansi';
import { useInput, useTheme } from 'termui';
import { AppShell } from '@/components/AppShell';
import { Spinner } from '@/components/Spinner';
import { AIService, ChatMessage } from '@/services/aiService';

import { Heading } from '@/components/Heading';

export default function AIChatScreen({ user, navigate }: any) {
  const theme = useTheme();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);

  const { stdout } = useStdout();

  // Load history from DB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const dbHistory = await AIService.getHistory(user.id);
        setHistory(dbHistory);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [user.id]);

  const handleSubmit = async () => {
    const userMessage = input.trim();
    if (!userMessage || isThinking) return;



    if (userMessage.toLowerCase() === '/clear') {
      try {
        await AIService.clearHistory(user.id);
        setHistory([]);
        setInput('');
      } catch (err) {}
      return;
    }

    setInput('');
    setScrollOffset(0);

    const newHistory: ChatMessage[] = [
      ...history,
      { role: 'user', parts: [{ text: userMessage }] }
    ];
    setHistory(newHistory);

    setIsThinking(true);
    try {
      await AIService.saveMessage(user.id, userMessage, false);
      const response = await AIService.sendChatMessage(userMessage, history);
      await AIService.saveMessage(user.id, response, true);

      setHistory(h => [
        ...h,
        { role: 'model', parts: [{ text: response }] }
      ]);
    } catch (err: any) {
      const fallback = "sorry, an error occured from my side. try again later.";
      await AIService.saveMessage(user.id, fallback, true);
      setHistory(h => [
        ...h,
        { role: 'model', parts: [{ text: fallback }] }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  useInput((_input, key) => {
    if (key.upArrow) {
      setScrollOffset(s => s + 1);
    } else if (key.downArrow) {
      setScrollOffset(s => Math.max(0, s - 1));
    } else if (key.escape) {
      navigate('dashboard', { initialMenu: 'chats' });
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box paddingX={1} borderStyle="single" borderColor="green" flexDirection="row">
          <Heading level={1}>AI Assistant</Heading>
        </Box>
      </AppShell.Header>
      <AppShell.Content height={stdout?.rows ? Math.max(10, stdout.rows - 7) : 20}>
        {isLoading && history.length === 0 ? (
          <Box padding={1}>
            <Spinner label="Loading conversation history..." />
          </Box>
        ) : (
          <Box flexDirection="column" paddingX={1} paddingY={1} width="100%" flexGrow={1}>
            {(() => {
              if (history.length === 0 && !isThinking) {
                return <Text dimColor italic>Hello! I am your AI assistant. Ask me anything about the terminal, coding, or TermChat!</Text>;
              }

              const width = stdout?.columns || 100;
              const height = stdout?.rows || 24;
              const chatHeight = Math.max(5, height - 12);

              const allLines: React.ReactNode[] = [];

              history.forEach((turn, turnIdx) => {
                const isUser = turn.role === 'user';
                const prefix = isUser ? 'You: ' : 'TermChat AI: ';
                const prefixLen = prefix.length;
                const content = turn.parts[0].text;

                const wrappedContent = wrapAnsi(content, Math.max(10, width - prefixLen - 6), { hard: true, trim: false });
                const contentLines = wrappedContent.split('\n');

                contentLines.forEach((lineText, idx) => {
                  allLines.push(
                    <Box key={`t${turnIdx}-l${idx}`} flexDirection="row">
                      {idx === 0 ? (
                        <Text color={isUser ? '#50fa7b' : 'cyan'} bold>
                          {prefix}
                        </Text>
                      ) : (
                        <Text>{' '.repeat(prefixLen)}</Text>
                      )}
                      <Text> {lineText}</Text>
                    </Box>
                  );
                });

                // Add a small gap between turns
                if (turnIdx < history.length - 1 || isThinking) {
                  allLines.push(<Box key={`gap-${turnIdx}`} height={1} />);
                }
              });

              if (isThinking) {
                allLines.push(
                  <Box key="thinking" gap={1}>
                    <Spinner label="TermChat AI is thinking..." />
                  </Box>
                );
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
        placeholder="Ask the AI something..."
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        borderStyle="single"
        borderColor="green"
      />
      <AppShell.Hints items={['Enter: Ask', '↑↓: Scroll', 'Esc: Back', '/clear: Clear']} />
    </AppShell>
  );
}
