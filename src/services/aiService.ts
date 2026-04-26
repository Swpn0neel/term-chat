import { GoogleGenerativeAI } from '@google/generative-ai';
import "dotenv/config";
import { prisma } from '@/lib/prisma';

const SYSTEM_INSTRUCTION = 'You are TermChat AI, a friendly and warm assistant integrated into a terminal chat application. Your responses MUST be total plain text ONLY. ABSOLUTELY NO markdown, no bolding (**), no italics (_), and no lists (no numbered lists, no bullet points). If you have multiple points to make, write them as consecutive, well-structured paragraphs of plain text. Keep it minimal, friendly, and extremely readable in a basic terminal without any special characters or decorations.';

import { AVAILABLE_MODELS, ModelId } from '@/lib/models';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  createdAt?: Date;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
}

export class AIService {
  static getModelInfo(modelId: string) {
    return AVAILABLE_MODELS.find(m => m.id === modelId) ?? AVAILABLE_MODELS[0];
  }

  private static getDefaultModel(): ModelId {
    return 'gemini-2.5-flash';
  }

  private static makeModel(apiKey: string, modelId?: string, systemInstruction?: string) {
    const model = modelId || this.getDefaultModel();
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
      model,
      systemInstruction: systemInstruction || SYSTEM_INSTRUCTION,
    });
  }

  private static buildHistory(history: ChatMessage[]) {
    // Limit context to the last 20 messages to keep the AI focused
    // and avoid irrelevant context from very old messages.
    const MAX_CONTEXT = 20;
    const recentHistory = history.length > MAX_CONTEXT 
      ? history.slice(-MAX_CONTEXT) 
      : history;

    return recentHistory
      .filter(m => {
        if (m.role === 'user') return true;
        const text = m.parts[0].text;
        // Exclude system and error messages from context
        if (text.startsWith('System:')) return false;
        if (text.startsWith('Switched to ')) return false;
        if (text.startsWith('Current model:')) return false;
        if (text.startsWith('Unknown model ')) return false;
        if (text.startsWith('Use /model')) return false;
        if (text === 'An error occurred in the generation of the response.') return false;
        if (text.startsWith("You haven't set your Gemini API key")) return false;
        if (text.startsWith('Your API key seems invalid')) return false;
        return true;
      })
      .map(m => ({
        role: m.role,
        parts: m.parts,
      }));
  }

  /**
   * Streaming: sends message and calls onChunk per token until done.
   */
  static async streamChatMessage(
    content: string,
    history: ChatMessage[],
    userApiKey?: string,
    modelId?: string,
    callbacks?: StreamCallbacks
  ) {
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-key') {
      throw new Error('NO_KEY');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const userModel = genAI.getGenerativeModel({
        model: modelId || this.getDefaultModel(),
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      const chat = userModel.startChat({
        history: this.buildHistory(history),
        generationConfig: { maxOutputTokens: 4096 },
      });

      const result = await chat.sendMessageStream(content);
      let fullText = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        callbacks?.onChunk(chunkText);
      }

      callbacks?.onDone(fullText);
      return fullText;
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('API key')) {
        throw new Error('INVALID_KEY');
      }
      throw err;
    }
  }

  /**
   * Non-streaming fallback
   */
  static async sendChatMessage(
    content: string,
    history: ChatMessage[] = [],
    userApiKey?: string,
    modelId?: string,
    systemInstruction?: string
  ) {
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-key') {
      throw new Error('NO_KEY');
    }

    try {
      const userModel = this.makeModel(apiKey, modelId, systemInstruction);
      const chat = userModel.startChat({
        history: this.buildHistory(history),
        generationConfig: { maxOutputTokens: 4096 },
      });
      const result = await chat.sendMessage(content);
      return result.response.text();
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('API key')) {
        throw new Error('INVALID_KEY');
      }
      throw err;
    }
  }

  static async updateApiKey(userId: string, apiKey: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { geminiApiKey: apiKey.trim() },
    });
  }

  static async getHistory(userId: string): Promise<ChatMessage[]> {
    const messages = await prisma.message.findMany({
      where: {
        senderId: userId,
        isAIChat: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(m => ({
      role: m.isAIResponse ? 'model' : 'user',
      parts: [{ text: m.content }],
      createdAt: m.createdAt,
    }));
  }

  /**
   * Save a user or AI message to the DB, storing the model id on AI responses.
   */
  static async saveMessage(
    userId: string,
    content: string,
    isAIResponse: boolean,
    model?: string,
    title?: string
  ) {
    await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: userId,
        content: content.trim(),
        isAIChat: true,
        isAIResponse,
        model: isAIResponse ? model : undefined,
        title: isAIResponse ? title : undefined,
      },
    });
  }

  static async clearHistory(userId: string) {
    await prisma.message.deleteMany({
      where: { senderId: userId, isAIChat: true },
    });
  }
}