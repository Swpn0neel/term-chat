import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Text, useStdout } from 'ink';
import wrapAnsi from 'wrap-ansi';
import { useInput, useTheme } from '@/lib/theme';
import { AppShell } from '@/components/AppShell';
import { Spinner } from '@/components/Spinner';
import { AIService, ChatMessage } from '@/services/aiService';
import { AVAILABLE_MODELS, ModelId } from '@/lib/models';
import { Heading } from '@/components/Heading';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { session } from '@/lib/session';

export default function AIChatScreen({ user, navigate }: any) {
  const theme = useTheme();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(user.geminiApiKey || null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [currentModel, setCurrentModel] = useState<ModelId>(session.getAIModel() as ModelId);

  // Streaming & Typing state
  const [streamText, setStreamText] = useState('');
  const fullResponseRef = useRef('');
  const displayedCountRef = useRef(0);
  const streamDoneRef = useRef(false);
  const streamDoneCbRef = useRef<(() => void) | null>(null);

  const { stdout } = useStdout();

  const handleStreamChunk = useCallback((text: string) => {
    fullResponseRef.current += text.replace(/\n/g, ' ');
  }, []);

  const handleStreamDone = useCallback((_fullText: string) => {
    streamDoneRef.current = true;
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const tick = () => {
      if (displayedCountRef.current < fullResponseRef.current.length) {
        // Typing animation: Reveal one character at a time
        displayedCountRef.current++;
        setStreamText(fullResponseRef.current.slice(0, displayedCountRef.current));
        
        // Speed up if we are falling too far behind the real stream
        const behind = fullResponseRef.current.length - displayedCountRef.current;
        const delay = behind > 100 ? 5 : behind > 20 ? 15 : 30;
        timer = setTimeout(tick, delay);
      } else if (streamDoneRef.current) {
        // Everything received and everything typed
        const finalContent = fullResponseRef.current;
        
        // Finalize
        setHistory(h => [...h, { role: 'model', parts: [{ text: finalContent }], createdAt: new Date() }]);
        setIsThinking(false);
        setStreamText('');
        fullResponseRef.current = '';
        displayedCountRef.current = 0;
        streamDoneRef.current = false;
        streamDoneCbRef.current?.();
      } else if (isThinking) {
        // Still thinking/streaming, wait for more content
        timer = setTimeout(tick, 50);
      }
    };

    if (isThinking) {
      tick();
    }

    return () => clearTimeout(timer);
  }, [isThinking]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const dbHistory = await AIService.getHistory(user.id);
        setHistory(dbHistory);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [user.id]);

  const handleSubmit = async () => {
    const userMessage = input.trim();
    if (!userMessage || isThinking) return;

    if (userMessage.toLowerCase().startsWith('/set ')) {
      const newKey = userMessage.split(' ')[1];
      if (!newKey) return;
      try {
        await AIService.updateApiKey(user.id, newKey);
        setApiKey(newKey);
        setInput('');
        setHistory(h => [
          ...h,
          { role: 'model', parts: [{ text: 'System: Your Gemini API key has been updated and saved.' }], createdAt: new Date() },
        ]);
      } catch {
        setHistory(h => [
          ...h,
          { role: 'model', parts: [{ text: 'System: Failed to save your API key. Try again later.' }], createdAt: new Date() },
        ]);
      }
      return;
    }

    if (userMessage.toLowerCase() === '/clear') {
      try {
        await AIService.clearHistory(user.id);
        setHistory([]);
        setInput('');
      } catch {}
      return;
    }

    if (userMessage.toLowerCase().startsWith('/model')) {
      const parts = userMessage.split(' ');
      if (parts.length < 2) {
        const info = AIService.getModelInfo(currentModel);
        setHistory(h => [
          ...h,
          {
            role: 'model',
            parts: [
              {
                text:
                  `Current model: ${info.name} (${currentModel}).\nAvailable models:\n` +
                  AVAILABLE_MODELS.map(m => `  /model ${m.name.toLowerCase().replace(/\s+/g, '')} - ${m.description}`).join('\n') +
                  '\n\nUse /model <name> to switch (e.g. /model flash, /model pro, /model flash-lite)',
              },
            ],
            createdAt: new Date(),
          },
        ]);
        setInput('');
        return;
      }

      const modelArg = parts[1].toLowerCase();
      const matched = AVAILABLE_MODELS.find(
        m =>
          m.name.toLowerCase() === modelArg ||
          m.id.toLowerCase().includes(modelArg) ||
          m.id.split('-').pop() === modelArg
      );

      if (!matched) {
        setHistory(h => [
          ...h,
          {
            role: 'model',
            parts: [{ text: `Unknown model "${parts[1]}". Available: ${AVAILABLE_MODELS.map(m => m.name).join(', ')}` }],
            createdAt: new Date(),
          },
        ]);
      } else {
        const newModel = matched.id as ModelId;
        setCurrentModel(newModel);
        session.setAIModel(newModel);
        setHistory(h => [
          ...h,
          {
            role: 'model',
            parts: [{ text: `Switched to ${matched.name}. Ready for next message.` }],
            createdAt: new Date(),
          },
        ]);
      }
      setInput('');
      return;
    }

    setInput('');
    setScrollOffset(0);

    setHistory(h => [...h, { role: 'user', parts: [{ text: userMessage }], createdAt: new Date() }]);

    setIsThinking(true);
    fullResponseRef.current = '';
    displayedCountRef.current = 0;
    streamDoneRef.current = false;
    setStreamText('');

    await AIService.saveMessage(user.id, userMessage, false);

    try {
      if (!apiKey) {
        throw new Error('NO_KEY');
      }

      const fullText = await AIService.streamChatMessage(
        userMessage,
        history,
        apiKey,
        currentModel,
        {
          onChunk: handleStreamChunk,
          onDone: handleStreamDone,
        }
      );

      // Persist the successful response
      await AIService.saveMessage(user.id, fullText, true, currentModel);
    } catch (err: any) {
      let fallback = 'An error occurred in the generation of the response.';
      if (err.message === 'NO_KEY') {
        fallback = "You haven't set your Gemini API key yet. Use '/set [your-key]' to start chatting.";
      } else if (err.message === 'INVALID_KEY') {
        fallback = 'Your API key seems invalid or expired. Update it with /set [your-key].';
      }
      
      await AIService.saveMessage(user.id, fallback, true, currentModel);
      setHistory(h => [...h, { role: 'model', parts: [{ text: fallback }], createdAt: new Date() }]);
      setIsThinking(false);
      setStreamText('');
      fullResponseRef.current = '';
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
      if (streamText) streamDoneCbRef.current?.();
      navigate('dashboard', { initialMenu: 'chats' });
    }
  });

  const commands = [
    { name: '/model flash', description: 'Switch to Gemini Flash', value: '/model flash' },
    { name: '/model pro', description: 'Switch to Gemini Pro', value: '/model pro' },
    { name: '/model flash-lite', description: 'Switch to Gemini Flash Lite', value: '/model flash-lite' },
    { name: '/clear', description: 'Clear conversation history', value: '/clear' },
    { name: '/set', description: 'Set or Update API Key (/set [key])', value: '/set' }
  ];

  const modelInfo = AIService.getModelInfo(currentModel);
  const contentRows = stdout?.rows || 24;

  return (
    <AppShell>
      <AppShell.Header>
        <Box paddingX={1} borderStyle="single" borderColor={theme.colors.secondary} flexDirection="row">
          <Heading level={1}>AI Assistant</Heading>
          <Text dimColor> · {modelInfo.name}</Text>
        </Box>
      </AppShell.Header>
      <AppShell.Content>
        {isLoading && history.length === 0 ? (
          <Box padding={1}>
            <Spinner label="Loading conversation history..." />
          </Box>
        ) : (
          <ChatOutput
            history={history}
            streamText={streamText}
            isThinking={isThinking}
            theme={theme}
            width={stdout?.columns || 100}
            rows={contentRows}
            scrollOffset={scrollOffset}
          />
        )}
      </AppShell.Content>
      <AppShell.Input
        placeholder="Ask the AI something..."
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        borderStyle="single"
        borderColor={theme.colors.secondary}
        commands={commands}
        onOverlayActiveChange={setIsOverlayActive}
      />
      <AppShell.Hints
        items={['enter: ask', '↑↓: scroll', 'esc: back', '/: options']}
      />
    </AppShell>
  );
}

interface ChatOutputProps {
  history: ChatMessage[];
  streamText: string;
  isThinking: boolean;
  theme: ReturnType<typeof useTheme>;
  width: number;
  rows: number;
  scrollOffset: number;
}

function renderRichLine(text: string, isUser: boolean, theme: any) {
  if (isUser) return <Text>{text}</Text>;

  // Highlight Current Model info
  if (text.startsWith('Current model:')) {
    const match = text.match(/Current model: (.*) \((.*)\)\./);
    if (match) {
      return (
        <Text>
          Current model: <Text color={theme.colors.secondary} bold>{match[1]}</Text> <Text dimColor>({match[2]})</Text>.
        </Text>
      );
    }
  }

  // Highlight Command list: "/model [name] - [description]"
  if (text.trim().startsWith('/model') && text.includes(' - ')) {
    const [cmd, ...rest] = text.split(' - ');
    return (
      <Text>
        <Text color={theme.colors.warning}>{cmd}</Text>
        <Text dimColor> - {rest.join(' - ')}</Text>
      </Text>
    );
  }

  // Dim help hints
  if (text.startsWith('Use /model')) {
    return <Text dimColor italic>{text}</Text>;
  }

  // Highlight system messages
  if (text.startsWith('System:')) {
    return (
      <Text>
        <Text color={theme.colors.warning} bold>System:</Text>
        <Text>{text.substring(7)}</Text>
      </Text>
    );
  }

  return <Text>{text}</Text>;
}

function ChatOutput({ history, streamText, isThinking, theme, width, rows, scrollOffset }: ChatOutputProps) {
  if (history.length === 0 && !isThinking && !streamText) {
    return (
      <Text dimColor italic> Hello! I am your AI assistant. Ask me anything or use /model to switch models.</Text>
    );
  }

  const chatHeight = Math.max(5, rows - 7);
  const allLines: React.ReactNode[] = [];
  
  let lastRole = '';

  if (history.length > 0) {
    history.forEach((turn, turnIdx) => {
      const isUser = turn.role === 'user';
      const content = turn.parts[0].text;
      const isSystem = content.startsWith('System: ');
      const isSameSender = !isSystem && turn.role === lastRole;
      let displayContent = isSystem ? content.substring(8) : content;
      if (turn.role === 'model' && !isSystem) {
        displayContent = displayContent.replace(/\n/g, ' ');
      }
      const time = turn.createdAt ? new Date(turn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
      const timePrefix = `[${time}] `;
      const indent = timePrefix.length;
      
      const prefix = isUser ? 'You: ' : 'TermChat AI: ';
      const userColor = isUser ? theme.colors.success : theme.colors.secondary;

      if (!isSameSender && turnIdx > 0) {
        allLines.push(<Box key={`gap-${turnIdx}`} height={1} flexShrink={0} />);
      }

      const contentWidth = Math.max(10, width - indent - 4);
      const wrappedContent = wrapAnsi(displayContent, contentWidth, { hard: true, trim: false });
      const contentLines = wrappedContent.split('\n');

      if (!isSameSender) {
        // New sender header
        allLines.push(
          <Box key={`t${turnIdx}-header`} flexDirection="row" flexShrink={0}>
            <Text dimColor color={theme.colors.mutedForeground}>{timePrefix}</Text>
            <Text color={userColor} bold>{prefix}</Text>
          </Box>
        );

        contentLines.forEach((lineText, idx) => {
          allLines.push(
            <Box key={`t${turnIdx}-l${idx}`} flexDirection="row" flexShrink={0}>
              <Text>{' '.repeat(indent)}</Text>
              <Text>{renderRichLine(lineText, isUser, theme)}</Text>
            </Box>
          );
        });
      } else {
        // Same sender - compact format
        contentLines.forEach((lineText, idx) => {
          allLines.push(
            <Box key={`t${turnIdx}-l${idx}`} flexDirection="row" flexShrink={0}>
              {idx === 0 ? (
                <Text dimColor color={theme.colors.mutedForeground}>{timePrefix}</Text>
              ) : (
                <Text>{' '.repeat(indent)}</Text>
              )}
              <Text>{renderRichLine(lineText, isUser, theme)}</Text>
            </Box>
          );
        });
      }

      lastRole = isSystem ? '' : turn.role;
    });
  }

  if (isThinking || streamText) {
    const isSameSender = lastRole === 'model';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timePrefix = `[${time}] `;
    const indent = timePrefix.length;
    const userColor = theme.colors.secondary;
    const contentWidth = Math.max(10, width - indent - 4);

    if (!isSameSender && history.length > 0) {
      allLines.push(<Box key="gap-streaming" height={1} flexShrink={0} />);
    }

    if (streamText) {
      const wrappedStream = wrapAnsi(streamText, contentWidth, { hard: true, trim: false });
      const streamLines = wrappedStream.split('\n');

      if (!isSameSender) {
        allLines.push(
          <Box key="stream-header" flexDirection="row" flexShrink={0}>
            <Text dimColor color={theme.colors.mutedForeground}>{timePrefix}</Text>
            <Text color={userColor} bold>TermChat AI: </Text>
          </Box>
        );
        streamLines.forEach((lineText, idx) => {
          allLines.push(
            <Box key={`stream-l${idx}`} flexDirection="row" flexShrink={0}>
              <Text>{' '.repeat(indent)}</Text>
              <Text>{renderRichLine(lineText, false, theme)}</Text>
            </Box>
          );
        });
      } else {
        streamLines.forEach((lineText, idx) => {
          allLines.push(
            <Box key={`stream-l${idx}`} flexDirection="row" flexShrink={0}>
              {idx === 0 ? (
                <Text dimColor color={theme.colors.mutedForeground}>{timePrefix}</Text>
              ) : (
                <Text>{' '.repeat(indent)}</Text>
              )}
              <Text>{renderRichLine(lineText, false, theme)}</Text>
            </Box>
          );
        });
      }
    } else if (isThinking) {
      allLines.push(
        <Box key="thinking" gap={1} flexShrink={0}>
          <Spinner label="TermChat AI is thinking..." />
        </Box>
      );
    }
    
    allLines.push(<Box key="ai-active-gap" height={1} flexShrink={0} />);
  }

  const maxLines = Math.max(1, chatHeight);
  const totalLines = allLines.length;
  const maxOffset = Math.max(0, totalLines - maxLines);
  const currentOffset = Math.min(scrollOffset, maxOffset);
  const start = Math.max(0, totalLines - maxLines - currentOffset);
  const end = totalLines - currentOffset;

  return <>{allLines.slice(start, end)}</>;
}