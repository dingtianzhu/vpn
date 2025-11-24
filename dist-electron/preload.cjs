"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    connectVpn: (config) => electron.ipcRenderer.invoke("vpn:connect", config),
    disconnectVpn: () => electron.ipcRenderer.invoke("vpn:disconnect"),
    onStatusChange: (callback) => {
      const subscription = (_event, value) => callback(value);
      electron.ipcRenderer.on("vpn:status-changed", subscription);
      return () => electron.ipcRenderer.removeListener("vpn:status-changed", subscription);
    }
  }
});
