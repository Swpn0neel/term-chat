import React, { createContext, useContext, useState } from 'react';

type GlobalState = {
  unreadCounts: Record<string, number>;
  pendingCount: number;
  groupUnreadCounts: Record<string, number>;
  totalGroupUnread: number;
  fileTransferCount: number;
};

type PollingContextType = {
  global: GlobalState;
  screenData: any;
  setPollData: (data: { global: GlobalState; screenData: any }) => void;
  triggerImmediatePoll: () => void;
  onImmediatePoll: ((callback: () => void) => void) | null;
  setOnImmediatePoll: (cb: () => void) => void;
};

const PollingContext = createContext<PollingContextType | null>(null);

export const PollingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [global, setGlobal] = useState<GlobalState>({
    unreadCounts: {},
    pendingCount: 0,
    groupUnreadCounts: {},
    totalGroupUnread: 0,
    fileTransferCount: 0,
  });
  const [screenData, setScreenData] = useState<any>({});
  const [onImmediatePoll, setOnImmediatePoll] = useState<(() => void) | null>(null);

  const setPollData = (data: { global: GlobalState; screenData: any }) => {
    setGlobal(data.global);
    setScreenData(data.screenData);
  };

  const triggerImmediatePoll = () => {
    if (onImmediatePoll) {
      onImmediatePoll();
    }
  };

  return (
    <PollingContext.Provider value={{ global, screenData, setPollData, triggerImmediatePoll, onImmediatePoll, setOnImmediatePoll }}>
      {children}
    </PollingContext.Provider>
  );
};

export const usePolling = () => {
  const context = useContext(PollingContext);
  if (!context) {
    throw new Error('usePolling must be used within a PollingProvider');
  }
  return context;
};
