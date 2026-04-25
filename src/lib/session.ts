/**
 * Global session tracker to allow exit hooks 
 * and components to access shared state.
 */

export type ConnectionStatus = 'online' | 'slow' | 'disconnected';

let currentUserId: string | null = null;
let connectionStatus: ConnectionStatus = 'online';
let aiModel: string = 'gemini-2.5-flash';
const listeners = new Set<(status: ConnectionStatus) => void>();

export const session = {
  getUserId: () => currentUserId,
  setUserId: (id: string | null) => {
    currentUserId = id;
  },

  getAIModel: () => aiModel,
  setAIModel: (model: string) => {
    aiModel = model;
  },

  getConnectionStatus: () => connectionStatus,
  setConnectionStatus: (status: ConnectionStatus) => {
    if (connectionStatus === status) return;
    connectionStatus = status;
    listeners.forEach(l => l(status));
  },
  subscribeToConnection: (listener: (status: ConnectionStatus) => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }
};
