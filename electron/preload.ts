// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    connectVpn: (config: string) => ipcRenderer.invoke("vpn:connect", config),
    disconnectVpn: () => ipcRenderer.invoke("vpn:disconnect"),
    onStatusChange: (callback: (status: string) => void) => {
      const subscription = (_event: any, value: string) => callback(value);
      ipcRenderer.on("vpn:status-changed", subscription);
      return () =>
        ipcRenderer.removeListener("vpn:status-changed", subscription);
    },
  },
});
