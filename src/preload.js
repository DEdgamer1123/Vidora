const { contextBridge, ipcRenderer } = require('electron')

const themeArg = process.argv.find(a => a.startsWith('--theme='))
const theme    = themeArg ? themeArg.split('=')[1] : 'dark'

contextBridge.exposeInMainWorld('vidora', {
  theme,
  openFile:       ()     => ipcRenderer.invoke('dialog:openFile'),
  openDir:        ()     => ipcRenderer.invoke('dialog:openDir'),
  readUrls:       (p)    => ipcRenderer.invoke('excel:readUrls', p),
  startDownload:  (opts) => ipcRenderer.invoke('download:start', opts),
  onProgress:     (cb)   => ipcRenderer.on('download:progress', (_, d) => cb(d)),
  removeProgress: ()     => ipcRenderer.removeAllListeners('download:progress'),
  winMinimize:    ()     => ipcRenderer.send('win:minimize'),
  winMaximize:    ()     => ipcRenderer.send('win:maximize'),
  winClose:       ()     => ipcRenderer.send('win:close'),
})