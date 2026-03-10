/* ════════════════════════════════════════════════════════════════
   RENDERER — Vidora Electron
   ════════════════════════════════════════════════════════════════ */

/* ── Controles de ventana ─────────────────────────────────────── */
document.getElementById('btn-min').addEventListener('click',   () => window.vidora.winMinimize())
document.getElementById('btn-max').addEventListener('click',   () => window.vidora.winMaximize())
document.getElementById('btn-close').addEventListener('click', () => window.vidora.winClose())

/* ── Tema: detectar modo claro/oscuro ────────────────────────── */
const IS_LIGHT = window.vidora.theme === 'light'
if (IS_LIGHT) document.body.classList.add('light')

/* ── Logo segun tema ──────────────────────────────────────────── */
;(function loadLogo() {
  const img  = document.getElementById('logo-img')
  const ph   = document.getElementById('logo-ph')
  const base = decodeURIComponent(location.pathname.replace(/[^/\\]*$/, ''))
  const file = IS_LIGHT ? '../resources/Logo_negro.ico' : '../resources/Logo_blanco.ico'
  img.src = base + file
  img.onerror = () => { img.style.display = 'none'; ph.style.display = 'flex' }
})()

/* ════════════════════════════════════════════════════════════════
   CANVAS DE FONDO GLOBAL
   ════════════════════════════════════════════════════════════════ */
const canvas = document.getElementById('bg-canvas')
const ctx    = canvas.getContext('2d')
let   animT  = 0
let   stars  = []

/* PRNG determinista */
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function initStars(w, h) {
  const rng = mulberry32(42)
  stars = Array.from({ length: 130 }, () => ({
    x: rng() * w, y: rng() * h,
    r: 0.25 + rng() * 1.3,
    sp: rng() * Math.PI * 2,
    speed: 0.3 + rng() * 0.5,
  }))
}

function resizeCanvas() {
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
  initStars(canvas.width, canvas.height)
}

/* ── Definición de olas tipo fluido ────────────────────────────
   Cada ola tiene:
   - múltiples componentes sinusoidales sumadas (más natural)
   - relleno con gradiente vertical (efecto fluido/glow)
   - velocidad lenta y variada
*/
const FLUID_WAVES = [
  // { y_r, componentes:[amp,freq,phase,speed], strokeRGB, fillRGB, lw, fillOpTop, fillOpBot }

  // Ola magenta brillante — zona alta derecha (como en imagen)
  {
    y_r: 0.18,
    comps: [[30, 1.5, 0.0, 0.008], [12, 3.2, 1.2, 0.005], [6, 5.0, 2.5, 0.003]],
    stroke: '220,80,255',
    fill:   '200,70,240',
    lw: 2.0,
    opTop: 0.18, opBot: 0.0,
  },
  // Ola azul brillante — zona alta
  {
    y_r: 0.22,
    comps: [[22, 2.0, 0.8, 0.007], [9, 4.0, 2.0, 0.004], [5, 6.0, 1.0, 0.002]],
    stroke: '80,160,255',
    fill:   '60,140,255',
    lw: 1.8,
    opTop: 0.14, opBot: 0.0,
  },
  // Ola purpura principal — zona media-alta
  {
    y_r: 0.30,
    comps: [[40, 1.8, 1.5, 0.006], [16, 3.5, 0.5, 0.004], [8, 6.5, 3.0, 0.002]],
    stroke: '140,80,255',
    fill:   '120,60,240',
    lw: 2.2,
    opTop: 0.20, opBot: 0.0,
  },
  // Ola celeste suave — zona media
  {
    y_r: 0.40,
    comps: [[28, 2.2, 2.2, 0.005], [11, 4.5, 0.8, 0.003], [6, 7.0, 1.8, 0.002]],
    stroke: '100,200,255',
    fill:   '80,180,255',
    lw: 1.5,
    opTop: 0.12, opBot: 0.0,
  },
  // Ola rosa-purpura — zona media-baja
  {
    y_r: 0.52,
    comps: [[35, 1.6, 0.3, 0.005], [14, 3.0, 1.8, 0.003], [7, 5.5, 3.5, 0.002]],
    stroke: '180,70,220',
    fill:   '160,55,200',
    lw: 1.6,
    opTop: 0.10, opBot: 0.0,
  },
  // Ola azul profundo — zona baja
  {
    y_r: 0.68,
    comps: [[25, 1.9, 1.0, 0.004], [10, 3.8, 2.5, 0.003], [5, 6.2, 0.5, 0.002]],
    stroke: '60,120,240',
    fill:   '50,100,220',
    lw: 1.3,
    opTop: 0.08, opBot: 0.0,
  },
  // Ola purpura tenue — zona muy baja
  {
    y_r: 0.82,
    comps: [[20, 2.1, 0.6, 0.004], [8, 4.2, 1.5, 0.002]],
    stroke: '120,60,200',
    fill:   '100,50,180',
    lw: 1.1,
    opTop: 0.06, opBot: 0.0,
  },
]

/* Tiempos individuales por ola para velocidades distintas */
const waveTimes = FLUID_WAVES.map(() => Math.random() * Math.PI * 2)

/* Calcula el Y de una ola en X dado su tiempo actual */
function waveY(wave, x, w, wt) {
  let y = 0
  for (const [amp, freq, phase, speed] of wave.comps) {
    y += amp * Math.sin(freq * (x / w) * Math.PI * 2 + phase + wt)
  }
  return y
}

/* Dibuja una ola como path relleno + línea encima */
function drawFluidWave(wave, w, h, wt) {
  const steps  = Math.max(Math.floor(w / 3), 100)
  const yBase  = h * wave.y_r
  const fillH  = h * 0.18   // altura del relleno hacia abajo

  // Construir path de la ola + cierre hacia abajo
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const x = (w * i) / steps
    const y = yBase + waveY(wave, x, w, wt)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  // Cerrar el path hacia abajo (relleno tipo fluido)
  ctx.lineTo(w, h + 10)
  ctx.lineTo(0, h + 10)
  ctx.closePath()

  // Gradiente vertical para el relleno (efecto glow/fluido)
  const grad = ctx.createLinearGradient(0, yBase - 20, 0, yBase + fillH)
  grad.addColorStop(0,   `rgba(${wave.fill}, ${wave.opTop})`)
  grad.addColorStop(0.4, `rgba(${wave.fill}, ${wave.opTop * 0.4})`)
  grad.addColorStop(1,   `rgba(${wave.fill}, 0)`)
  ctx.fillStyle = grad
  ctx.fill()

  // Línea encima (el borde brillante)
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const x = (w * i) / steps
    const y = yBase + waveY(wave, x, w, wt)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  const strokeOp = IS_LIGHT ? 0.45 : 0.65
  const glowOp2  = IS_LIGHT ? 0.18 : 0.30
  ctx.strokeStyle = `rgba(${wave.stroke}, ${strokeOp})`
  ctx.lineWidth   = wave.lw
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  ctx.stroke()

  // Segunda pasada — halo difuminado
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const x = (w * i) / steps
    const y = yBase + waveY(wave, x, w, wt)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.strokeStyle = `rgba(${wave.stroke}, ${glowOp2})`
  ctx.lineWidth   = wave.lw * 3.5
  ctx.stroke()
}

function drawFrame() {
  const w = canvas.width, h = canvas.height

  ctx.clearRect(0, 0, w, h)

  // ── Fondo (oscuro o claro segun tema) ───────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  if (IS_LIGHT) {
    bg.addColorStop(0.00, '#e8e0ff')
    bg.addColorStop(0.30, '#f0ebff')
    bg.addColorStop(0.70, '#ede5ff')
    bg.addColorStop(1.00, '#e4daff')
  } else {
    bg.addColorStop(0.00, '#090720')
    bg.addColorStop(0.25, '#0d0930')
    bg.addColorStop(0.60, '#0a071e')
    bg.addColorStop(1.00, '#060415')
  }
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // ── Glows radiales (atmosfera) ───────────────────────────────
  const glowOp = IS_LIGHT ? 0.55 : 1.0
  const glows = [
    { cx: 0.60, cy: 0.12, rx: 0.55, ry: 0.40, c: '100,50,220', op: IS_LIGHT ? 0.10 : 0.22 },
    { cx: 0.88, cy: 0.10, rx: 0.30, ry: 0.28, c: '200,55,220', op: IS_LIGHT ? 0.08 : 0.16 },
    { cx: 0.15, cy: 0.25, rx: 0.28, ry: 0.25, c: '60,100,220', op: IS_LIGHT ? 0.05 : 0.10 },
    { cx: 0.75, cy: 0.50, rx: 0.25, ry: 0.20, c: '140,60,240', op: IS_LIGHT ? 0.04 : 0.08 },
  ]
  for (const g of glows) {
    ctx.save()
    ctx.scale(1, g.ry / g.rx)
    const gr = ctx.createRadialGradient(g.cx*w, (g.cy*h)*(g.rx/g.ry), 0,
                                         g.cx*w, (g.cy*h)*(g.rx/g.ry), g.rx*w)
    gr.addColorStop(0, `rgba(${g.c},${g.op})`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gr
    ctx.fillRect(0, 0, w, h * (g.rx / g.ry))
    ctx.restore()
  }

  // ── Estrellas ────────────────────────────────────────────────
  for (const s of stars) {
    const ox = Math.sin(animT * s.speed * 0.5 + s.sp) * 1.8
    const oy = Math.cos(animT * s.speed * 0.4 + s.sp) * 1.4
    const a  = 0.15 + 0.65 * Math.abs(Math.sin(animT * s.speed * 0.6 + s.sp))
    ctx.beginPath()
    ctx.arc(s.x + ox, s.y + oy, s.r * 0.60, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`
    ctx.fill()
  }

  // ── Olas tipo fluido ─────────────────────────────────────────
  // Orden: de abajo hacia arriba para que las frontales queden encima
  for (let i = FLUID_WAVES.length - 1; i >= 0; i--) {
    waveTimes[i] += FLUID_WAVES[i].comps[0][3]  // cada ola avanza a su propia velocidad
    drawFluidWave(FLUID_WAVES[i], w, h, waveTimes[i])
  }

  requestAnimationFrame(drawFrame)
}

window.addEventListener('resize', resizeCanvas)
resizeCanvas()
requestAnimationFrame(drawFrame)

/* ════════════════════════════════════════════════════════════════
   LÓGICA DE LA APP
   ════════════════════════════════════════════════════════════════ */
let selectedFile    = ''
let selectedDir     = ''
let selectedWorkers = 5
let isRunning       = false

document.getElementById('worker-btns').addEventListener('click', e => {
  const btn = e.target.closest('.wbtn')
  if (!btn) return
  selectedWorkers = parseInt(btn.dataset.v, 10)
  document.querySelectorAll('.wbtn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
})

document.getElementById('btn-file').addEventListener('click', async () => {
  const p = await window.vidora.openFile()
  if (!p) return
  selectedFile = p
  document.getElementById('input-file').value = p
  if (!selectedDir) {
    const parts = p.replace(/\\/g, '/').split('/')
    parts.pop()
    selectedDir = parts.join('/') + '/videos'
    document.getElementById('input-dir').value = selectedDir
  }
})

document.getElementById('btn-dir').addEventListener('click', async () => {
  const p = await window.vidora.openDir()
  if (!p) return
  selectedDir = p
  document.getElementById('input-dir').value = p
})

document.getElementById('main-btn').addEventListener('click', async () => {
  if (isRunning) return
  if (!selectedFile) { alert('Selecciona un archivo Excel/CSV.'); return }
  if (!selectedDir)  { alert('Selecciona una carpeta de destino.'); return }

  const result = await window.vidora.readUrls(selectedFile)
  if (!result.ok)          { alert('Error al leer:\n' + result.error); return }
  if (!result.data.length) { alert('No se encontraron URLs.'); return }

  const videos = result.data, total = videos.length
  let done = 0

  isRunning = true
  setBtn(false, 'Descargando...')
  setProgress(0, `Preparando... 0 / ${total}`, '0%')
  clearLog()
  logLine(`Iniciando ${total} descargas  (${selectedWorkers} hilos)`, 'info')

  window.vidora.removeProgress()
  window.vidora.onProgress(({ ep, nombre, estado }) => {
    done++
    const pct = done / total
    if      (estado === 'ok')        logLine(`[OK]   Ep ${pad(ep)} — ${nombre}`, 'ok')
    else if (estado === 'ya existe') logLine(`[SKIP] Ep ${pad(ep)} — ${nombre}  [ya existe]`, 'skip')
    else                             logLine(`[ERR]  Ep ${pad(ep)} — ${nombre}  [${estado}]`, 'error')
    setProgress(pct, `Descargando...  ${done} / ${total}`, `${Math.round(pct * 100)}%`)
  })

  await window.vidora.startDownload({ videos, destDir: selectedDir, workers: selectedWorkers })

  isRunning = false
  setBtn(true, 'Iniciar descarga')
  setProgress(1, `Completado — ${total} videos`, '100%')
  logLine(`\nListo! ${total} videos procesados.`, 'done')
})

function pad(n) { return String(n).padStart(2, '0') }

function setBtn(enabled, text) {
  const b = document.getElementById('main-btn')
  b.disabled = !enabled; b.textContent = text
}

function setProgress(pct, estado, pctText) {
  document.getElementById('progress-fill').style.width = (pct * 100) + '%'
  document.getElementById('lbl-estado').textContent    = estado
  document.getElementById('lbl-pct').textContent       = pctText
}

function clearLog() { document.getElementById('log').innerHTML = '' }

function logLine(text, cls) {
  const log = document.getElementById('log')
  const span = document.createElement('span')
  if (cls) span.className = `log-${cls}`
  span.textContent = text + '\n'
  log.appendChild(span)
  log.scrollTop = log.scrollHeight
}