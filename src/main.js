const { app, BrowserWindow, ipcMain, dialog, Menu, nativeTheme } = require('electron')
const path = require('path')
const fs   = require('fs')
const https = require('https')
const http  = require('http')
const url   = require('url')

// ── Ruta a recursos (compatible con electron-builder) ──────────
function resourcePath(filename) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'resources', filename)
  }
  return path.join(__dirname, '..', 'resources', filename)
}

// ── Ventana principal ──────────────────────────────────────────
let win

function createWindow() {
  // Sin barra de menu nativa
  Menu.setApplicationMenu(null)

  const isDark = nativeTheme.shouldUseDarkColors

  win = new BrowserWindow({
    width:  980,
    height: 860,
    minWidth:  720,
    minHeight: 640,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: isDark ? '#0b0a1a' : '#f0eeff',
    icon: resourcePath('Logo_normal.ico'),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      additionalArguments: [`--theme=${isDark ? 'dark' : 'light'}`],
    }
  })

  win.loadFile(path.join(__dirname, 'index.html'))
}

app.whenReady().then(createWindow)

// ── IPC: Controles de ventana (frame personalizado) ───────────
ipcMain.on("win:minimize", () => win.minimize())
ipcMain.on("win:maximize", () => win.isMaximized() ? win.unmaximize() : win.maximize())
ipcMain.on("win:close",    () => win.close())


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: Seleccionar archivo ───────────────────────────────────
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Selecciona el archivo',
    filters: [
      { name: 'Excel / CSV', extensions: ['xlsx', 'xlsm', 'csv'] },
      { name: 'Todos',       extensions: ['*'] }
    ],
    properties: ['openFile']
  })
  if (canceled) return null
  return filePaths[0]
})

// ── IPC: Seleccionar carpeta ───────────────────────────────────
ipcMain.handle('dialog:openDir', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Carpeta de destino',
    properties: ['openDirectory', 'createDirectory']
  })
  if (canceled) return null
  return filePaths[0]
})

// ── IPC: Leer URLs del Excel ───────────────────────────────────
ipcMain.handle('excel:readUrls', async (_, filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase()

    if (ext === '.csv') {
      const text = fs.readFileSync(filePath, 'utf-8')
      const lines = text.split('\n').slice(1)   // saltar header
      const rows  = []
      for (const line of lines) {
        const parts = line.split(',')
        if (parts.length >= 2 && parts[1] && parts[1].trim()) {
          const ep  = parseInt(parts[0], 10)
          const url = parts[1].trim().replace(/^"|"$/g, '')
          if (!isNaN(ep) && url) rows.push({ ep, url })
        }
      }
      return { ok: true, data: rows }
    }

    // Excel: usamos xlsx (incluido en dependencies)
    const XLSX = require('xlsx')
    const wb   = XLSX.readFile(filePath)
    const ws   = wb.Sheets[wb.SheetNames[0]]
    const rows_raw = XLSX.utils.sheet_to_json(ws, { header: 1 })
    const rows = []
    for (let i = 1; i < rows_raw.length; i++) {
      const row = rows_raw[i]
      if (row && row.length >= 2 && row[1]) {
        const ep  = parseInt(row[0], 10)
        const url = String(row[1]).trim()
        if (!isNaN(ep) && url) rows.push({ ep, url })
      }
    }
    return { ok: true, data: rows }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// ── IPC: Descargar videos ──────────────────────────────────────
// Descarga un video y reporta progreso via evento al renderer
ipcMain.handle('download:start', async (_, { videos, destDir, workers }) => {
  // Crear carpeta si no existe
  fs.mkdirSync(destDir, { recursive: true })

  let active = 0
  let idx    = 0
  let done   = 0
  const total = videos.length

  return new Promise((resolve) => {
    function next() {
      while (active < workers && idx < total) {
        const { ep, url: videoUrl } = videos[idx++]
        active++
        downloadOne(ep, videoUrl, destDir)
          .then(result => {
            active--; done++
            win.webContents.send('download:progress', { ...result, done, total })
            if (done === total) resolve({ ok: true })
            else next()
          })
          .catch(err => {
            active--; done++
            win.webContents.send('download:progress', {
              ep, nombre: `${String(ep).padStart(2,'0')}.mp4`,
              estado: `error: ${err.message}`, done, total
            })
            if (done === total) resolve({ ok: true })
            else next()
          })
      }
    }
    next()
  })
})

function downloadOne(ep, videoUrl, destDir) {
  return new Promise((resolve, reject) => {
    const nombre = `${String(ep).padStart(2, '0')}.mp4`
    const dest   = path.join(destDir, nombre)

    if (fs.existsSync(dest)) {
      return resolve({ ep, nombre, estado: 'ya existe' })
    }

    const parsedUrl = new URL(videoUrl)
    const lib = parsedUrl.protocol === 'https:' ? https : http

    const req = lib.get(videoUrl, { timeout: 120000 }, (res) => {
      // Seguir redirecciones
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadOne(ep, res.headers.location, destDir)
          .then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const file = fs.createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve({ ep, nombre, estado: 'ok' })
      })
      file.on('error', (err) => {
        fs.unlink(dest, () => {})
        reject(err)
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('timeout'))
    })
  })
}