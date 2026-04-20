import React, { useState, useRef, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { Spinner } from '../components/ui/feedback/Spinner';
import { AIService, ChatMessage } from '../services/aiService';
import { shutdown } from '../lib/shutdown';

export default function AIChatScreen({ user, navigate }: any) {
  const theme = useTheme();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load history from DB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const dbHistory = await AIService.getHistory(user.id);
        setHistory(dbHistory);
      } catch (err) {
        // Silent fail to protect UI
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [user.id]);

  const handleSubmit = async () => {
    const userMessage = input.trim();
    if (!userMessage || isThinking) return;

    // Handle slash commands
    if (userMessage.toLowerCase() === '/quit') {
      await shutdown(user.id);
      return;
    }

    if (userMessage.toLowerCase() === '/clear') {
      try {
        await AIService.clearHistory(user.id);
        setHistory([]);
        setInput('');
      } catch (err) {}
      return;
    }

    setInput('');

    // Update local history
    const newHistory: ChatMessage[] = [
      ...history,
      { role: 'user', parts: [{ text: userMessage }] }
    ];
    setHistory(newHistory);

    setIsThinking(true);
    try {
      // Save User Message to DB
      await AIService.saveMessage(user.id, userMessage, false);

      const response = await AIService.sendChatMessage(userMessage, history);
      
      // Save AI Message to DB
      await AIService.saveMessage(user.id, response, true);

      setHistory(h => [
        ...h,
        { role: 'model', parts: [{ text: response }] }
      ]);
    } catch (err: any) {
      const fallback = "sorry, an error occured from my side. try again later.";
      
      // Save Error Fallback to DB
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
    if (key.escape) {
      navigate('dashboard');
    }
  });

  return (
    <AppShell>
      <AppShell.Header>
        <Box paddingX={1} borderStyle="single" borderColor="yellow">
          <Text bold>✨ TermChat AI Assistant</Text>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        <Box flexDirection="column" paddingX={1} paddingY={1}>
          {isLoading && history.length === 0 && (
            <Spinner label="Loading conversation history..." />
          )}

          {history.length === 0 && !isThinking && !isLoading && (
            <Text dimColor italic>Hello! I am your AI assistant. Ask me anything about the terminal, coding, or TermChat!</Text>
          )}

          {history.map((turn, idx) => (
            <Box key={idx} flexDirection="column" marginBottom={1}>
              <Text color={turn.role === 'user' ? 'green' : 'cyan'} bold>
                {turn.role === 'user' ? 'You:' : 'TermChat AI:'}
              </Text>
              <Text>{turn.parts[0].text}</Text>
            </Box>
          ))}

          {isThinking && (
            <Box marginTop={1} gap={1}>
              <Spinner label="TermChat AI is thinking..." />
            </Box>
          )}
        </Box>
      </AppShell.Content>
      <AppShell.Input
        placeholder="Ask the AI something..."
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        borderStyle="round"
        borderColor="yellow"
      />
      <AppShell.Hints items={['/quit: Close App', '/clear: Clear History', 'Enter: Ask', 'Esc: Back']} />
    </AppShell>
  );
}
