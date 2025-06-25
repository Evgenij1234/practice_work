const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

contextBridge.exposeInMainWorld("electron", {
  common: (events) => {
    console.log(`[IPC] Отправка события управления окном: ${events}`);
    if (events == "close") {
      ipcRenderer.send("close-window");
    } else if (events == "min") {
      ipcRenderer.send("min-window");
    } else if (events == "max") {
      ipcRenderer.send("max-window");
    }
  },
  sendData: (data) => {
    console.log("[IPC] Отправка данных формы:", data);
    ipcRenderer.send('form-data', data);
  },
  sendLog: (message) => {
    console.log("[IPC] Лог:", message);
    ipcRenderer.send('log-message', message); 
  },
  onLog: (callback) => {
    ipcRenderer.on('log-message-from-main', (event, message) => {
      console.log("[IPC] Получен лог из main:", message);
      callback(message); 
    });
  }
});