const { contextBridge, ipcRenderer } = require('electron');

const listenerMap = new Map();

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => {
    let channelListeners = listenerMap.get(channel);
    if (!channelListeners) {
      channelListeners = new Map();
      listenerMap.set(channel, channelListeners);
    }
    const existing = channelListeners.get(func);
    if (existing) {
      ipcRenderer.removeListener(channel, existing);
    }
    const wrapper = (event, ...args) => func(event, ...args);
    channelListeners.set(func, wrapper);
    ipcRenderer.on(channel, wrapper);
  },
  removeListener: (channel, func) => {
    const channelListeners = listenerMap.get(channel);
    if (!channelListeners) return;
    const wrapper = channelListeners.get(func);
    if (wrapper) {
      ipcRenderer.removeListener(channel, wrapper);
      channelListeners.delete(func);
      if (channelListeners.size === 0) {
        listenerMap.delete(channel);
      }
    }
  },
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});
