import { GoogleGenerativeAI } from '@google/generative-ai';
import "dotenv/config";
import { prisma } from '../lib/prisma';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  systemInstruction: 'You are TermChat AI, a friendly and warm assistant integrated into a terminal chat application. Your responses must be minimal, clean plain text ONLY. DO NOT use markdown symbols, bolding (**), italics (_), bullet points, or any other text decorations. Keep it simple, friendly, and readable in a basic terminal.'
});

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class AIService {
  /**
   * Start a new stateful chat session
   */
  static startChatSession(history: ChatMessage[] = []) {
    return model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 500,
      },
    });
  }

  /**
   * Send a message and get a response from Gemini
   */
  static async sendChatMessage(content: string, history: ChatMessage[] = []) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-key') {
      throw new Error('Gemini API Key is missing or invalid.');
    }

    try {
      const chat = this.startChatSession(history);
      const result = await chat.sendMessage(content);
      return result.response.text();
    } catch (err: any) {
      throw err;
    }
  }

  /**
   * Fetch AI chat history from DB
   */
  static async getHistory(userId: string, limit = 50): Promise<ChatMessage[]> {
    const messages = await prisma.message.findMany({
      where: {
        senderId: userId,
        isAIChat: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Reorder to ascending for UI and map to Gemini format
    return messages.reverse().map(m => ({
      role: m.isAIResponse ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
  }

  /**
   * Save a message and enforce the 50-message limit
   */
  static async saveMessage(userId: string, content: string, isAIResponse: boolean) {
    // 1. Save the new message
    await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: userId, // Self-referential for AI chat
        content: content.trim(),
        isAIChat: true,
        isAIResponse
      }
    });

    // 2. Enforce Strict Cleanup (Limit to 50)
    const oldMessages = await prisma.message.findMany({
      where: {
        senderId: userId,
        isAIChat: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: 50,
      select: { id: true }
    });

    if (oldMessages.length > 0) {
      const idsToDelete = oldMessages.map(m => m.id);
      await prisma.message.deleteMany({
        where: {
          id: { in: idsToDelete }
        }
      });
    }
  }

  /**
   * Delete all AI history for a user
   */
  static async clearHistory(userId: string) {
    await prisma.message.deleteMany({
      where: {
        senderId: userId,
        isAIChat: true
      }
    });
  }
}
