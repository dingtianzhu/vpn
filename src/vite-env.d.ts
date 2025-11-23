/// <reference types="vite/client" />

interface ElectronAPI {
  ipcRenderer: {
    connectVpn: (config: string) => Promise<string>;
    disconnectVpn: () => Promise<string>;
    onStatusChange: (callback: (status: string) => void) => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
