import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text } from 'ink';
import { useInput, useTheme } from 'termui';
import { AppShell } from '../components/ui/templates/AppShell';
import { Spinner } from '../components/ui/feedback/Spinner';
import { MessageService } from '../services/messageService';
import { SocialService } from '../services/socialService';
import { prisma } from '../lib/prisma';
import { shutdown } from '../lib/shutdown';
export default function ChatScreen({ user, friendId, navigate, onRead }) {
    const onReadRef = useRef(onRead);
    onReadRef.current = onRead;
    const theme = useTheme();
    const [messages, setMessages] = useState([]);
    const [friend, setFriend] = useState(null);
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
        }
        catch (err) { }
    }, [friendId]);
    const markRead = useCallback(async () => {
        try {
            await SocialService.markAsRead(user.id, friendId);
            onReadRef.current?.();
        }
        catch (err) { }
    }, [user.id, friendId]);
    const fetchConversation = useCallback(async (isInitial = false) => {
        if (isInitial)
            setIsLoading(true);
        try {
            const data = await MessageService.getConversation(user.id, friendId);
            // If we got new messages, mark them as read
            if (data.length > lastMessageCount.current) {
                markRead();
            }
            lastMessageCount.current = data.length;
            setMessages(data);
        }
        catch (err) {
            // Silent error handle
        }
        finally {
            if (isInitial)
                setIsLoading(false);
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
        if (!userMessage || isSending)
            return;
        if (userMessage.toLowerCase() === '/quit') {
            await shutdown(user.id);
            return;
        }
        setIsSending(true);
        setNewMessage(''); // Clear immediately for UX
        try {
            await MessageService.sendMessage(user.id, friendId, userMessage);
            await fetchConversation(); // Immediate refresh after send
        }
        catch (err) {
            setNewMessage(userMessage);
        }
        finally {
            setIsSending(false);
        }
    };
    useInput((_input, key) => {
        if (key.escape) {
            navigate('friend-list');
        }
    });
    return (_jsxs(AppShell, { children: [_jsx(AppShell.Header, { children: _jsxs(Box, { paddingX: 1, borderStyle: "single", borderColor: "blue", gap: 1, children: [_jsxs(Text, { bold: true, children: ["Chatting with: ", friend?.username || '...'] }), friend && (_jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "[ " }), (() => {
                                    const lastSeenDate = new Date(friend.lastSeen);
                                    const diffSeconds = (Date.now() - lastSeenDate.getTime()) / 1000;
                                    const isTrulyOnline = friend.isOnline && diffSeconds < 30;
                                    return (_jsx(Text, { color: isTrulyOnline ? '#50fa7b' : 'gray', children: isTrulyOnline ? '● Online' : '○ Offline' }));
                                })(), _jsx(Text, { dimColor: true, children: " ]" })] }))] }) }), _jsx(AppShell.Content, { children: isLoading ? (_jsx(Box, { padding: 1, children: _jsx(Spinner, { label: "Loading conversation history..." }) })) : (_jsxs(Box, { flexDirection: "column", paddingX: 1, paddingY: 1, children: [messages.length === 0 ? (_jsx(Text, { dimColor: true, italic: true, children: "No messages yet. Say hi!" })) : (messages.map((msg) => {
                            const isMe = msg.senderId === user.id;
                            const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (_jsxs(Box, { gap: 1, children: [_jsxs(Text, { dimColor: true, color: "gray", children: ["[", time, "]"] }), _jsxs(Text, { color: isMe ? '#50fa7b' : 'blue', bold: true, children: [isMe ? 'You' : msg.sender.username, ":"] }), _jsx(Text, { children: msg.content })] }, msg.id));
                        })), isSending && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, italic: true, children: "Sending..." }) }))] })) }), _jsx(AppShell.Input, { placeholder: "Type a message...", value: newMessage, onChange: setNewMessage, onSubmit: handleSend, borderStyle: "round", borderColor: "blue" }), _jsx(AppShell.Hints, { items: ['/quit: Close App', 'Enter: Send', 'Esc: Back'] })] }));
}
