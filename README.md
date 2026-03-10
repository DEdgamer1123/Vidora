<div align="center">

![Vidora Screenshot](assets/Vidora.png)

# Vidora
### Descargador Inteligente de Videos

[![Electron](https://img.shields.io/badge/Electron-29-47848F?logo=electron)](https://electronjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows)](https://github.com/DEdgamer1123/Vidora/releases)

</div>

---

## Que es Vidora?

Vidora es una aplicacion de escritorio para Windows que permite descargar videos en lote a partir de una lista de URLs almacenada en un archivo Excel o CSV. Diseñada con una interfaz moderna con animaciones fluidas y soporte para modo claro y oscuro automatico segun el sistema.

---

## Caracteristicas

- **Descarga por lotes** — carga un Excel o CSV con URLs y descarga todos los videos automaticamente
- **Concurrencia configurable** — elige entre 2, 3, 5, 8 o 10 descargas simultaneas
- **Modo claro / oscuro** — se adapta automaticamente al tema de Windows
- **Registro de actividad** — muestra en tiempo real el estado de cada descarga
- **Barra de progreso** — porcentaje actualizado durante el proceso
- **Omite duplicados** — si un archivo ya existe, lo salta sin sobreescribir
- **Soporte de redirecciones** — maneja redirecciones HTTP 301/302 automaticamente
- **Sin instalacion de Python** — todo corre nativamente con Node.js dentro de Electron

---

## Formato del archivo Excel / CSV

El archivo debe tener al menos dos columnas:

| Columna A | Columna B |
|-----------|-----------|
| 1         | https://ejemplo.com/video1.mp4 |
| 2         | https://ejemplo.com/video2.mp4 |

- **Columna A** — numero de episodio (se usa como nombre del archivo: `01.mp4`, `02.mp4`, etc.)
- **Columna B** — URL directa del video
- La primera fila se trata como encabezado y se omite automaticamente

---

## Instalacion

### Opcion 1 — Instalador (recomendado)
1. Descarga `Vidora Setup 1.0.0.exe` desde [Releases](https://github.com/DEdgamer1123/Vidora/releases)
2. Ejecuta el instalador
3. Si Windows muestra advertencia de SmartScreen, haz clic en **"Mas informacion" → "Ejecutar de todos modos"**

### Opcion 2 — Portable
1. Descarga `Vidora 1.0.0.exe` desde [Releases](https://github.com/DEdgamer1123/Vidora/releases)
2. Ejecuta directamente, sin instalacion

### Opcion 3 — Desde el codigo fuente
Requisitos: [Node.js](https://nodejs.org) v16 o superior

```bash
git clone https://github.com/DEdgamer1123/Vidora.git
cd Vidora
npm install
npm start
```

---

## Compilar el ejecutable

```bash
# Requiere abrir VSCode o terminal como Administrador
npm run build
```

Genera en la carpeta `dist/`:
- `Vidora Setup 1.0.0.exe` — instalador con wizard
- `Vidora 1.0.0.exe` — version portable

---

## Estructura del proyecto

```
Vidora/
├── resources/
│   ├── Logo_blanco.ico      # Logo para modo oscuro
│   ├── Logo_negro.ico       # Logo para modo claro
│   └── Logo_normal.ico      # Icono de la ventana y taskbar
├── src/
│   ├── index.html           # Interfaz de usuario (HTML + CSS)
│   ├── main.js              # Proceso principal de Electron (IPC, descargas)
│   ├── preload.js           # Puente seguro entre main y renderer
│   └── renderer.js          # Logica de UI, animaciones Canvas, eventos
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| [Electron 29](https://electronjs.org) | Framework de escritorio |
| HTML5 + CSS3 | Interfaz de usuario |
| Canvas 2D API | Animaciones de olas y particulas |
| Node.js `http`/`https` | Motor de descargas nativo |
| [xlsx](https://www.npmjs.com/package/xlsx) | Lectura de archivos Excel |
| [electron-builder](https://www.electron.build) | Empaquetado y distribución |


---

## Licencia

Este proyecto esta bajo la licencia MIT. Puedes usar, modificar y distribuir el codigo siempre que mantengas el aviso de copyright original. Ver [LICENSE](LICENSE) para mas detalles.

---

<div align="center">
Desarrollado por <a href="https://github.com/DEdgamer1123">DEdgamer1123</a>
</div>
