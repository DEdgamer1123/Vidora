# Vidora – Descargador Inteligente de Videos
### Versión Electron (reemplaza descargar_videos.py)

---

## INSTALACION

### 1. Instalar Node.js (si no lo tienes)
Descarga desde: https://nodejs.org  (versión LTS recomendada)
Verifica: `node --version` debe mostrar v18 o superior

### 2. Descomprimir el proyecto
Descomprime la carpeta `Vidora/` donde quieras tenerla.

### 3. Estructura de carpetas requerida
```
Vidora/
├── package.json
├── src/
│   ├── main.js
│   ├── preload.js
│   ├── index.html
│   └── renderer.js
└── resources/
    ├── Logo_blanco.ico   ← logo claro (topbar)
    ├── Logo_negro.ico    ← logo oscuro (modo claro, si se implementa)
    └── Logo_normal.ico   ← ícono de la ventana y taskbar
```

### 4. Instalar dependencias (una sola vez)
Abre una terminal en la carpeta `Vidora/` y ejecuta:
```
npm install
```
Descarga ~150MB (Electron + dependencias). Solo se hace una vez.

---

## EJECUCION (modo desarrollo)
```
npm start
```

---

## EMPAQUETADO EN .EXE

### Opcion A — Portable (.exe que no necesita instalacion)
```
npm run build
```
El archivo portable queda en: `dist/Vidora 1.0.0.exe`

### Opcion B — Instalador (.exe con wizard de instalacion)
```
npm run build-installer
```
El instalador queda en: `dist/Vidora Setup 1.0.0.exe`

> El empaquetado puede tardar 3-5 minutos la primera vez.
> El .exe final incluye todo — el usuario no necesita Node.js ni nada instalado.

---

## TAMAÑO DEL .EXE
- Portable: ~85 MB
- Instalado: ~200 MB en disco

---

## NOTAS
- El archivo `descargar_videos.py` ya NO se usa. Este proyecto lo reemplaza completamente.
- La lógica de descarga es idéntica: lee columna A (número) y B (URL) desde fila 2.
- Compatible con .xlsx, .xlsm y .csv
