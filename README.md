# 💖 Quiz San Valentín - Trivia Automático

[![Versión](https://img.shields.io/badge/versión-2.0-brightgreen.svg)](https://github.com)
[![Estado](https://img.shields.io/badge/estado-mejorado-success.svg)](https://github.com)
[![Última actualización](https://img.shields.io/badge/actualización-2026--02--08-blue.svg)](https://github.com)

Quiz interactivo personalizado para San Valentín con sistema de preguntas dinámicas, síntesis de voz y persistencia de datos.

## ✨ Nuevas Características (v2.0)

- 🗄️ **Base de datos JSON** - Preguntas externalizadas y fáciles de editar
- 🛡️ **Validación robusta** - Manejo de errores completo
- 🌐 **Compatibilidad cross-browser** - Funciona en todos los navegadores
- 💾 **Persistencia de datos** - Historial y estadísticas guardadas

Ver detalles completos en [MEJORAS_IMPLEMENTADAS.md](MEJORAS_IMPLEMENTADAS.md)

## 🚀 Inicio Rápido

1. Abre `index.html` en tu navegador
2. ¡Presiona "Empezar" y disfruta!

## 📂 Estructura del Proyecto

```
📦 1.Trivia-Automático
├── 📄 index.html              # Página principal
├── 📄 script.js               # Lógica del juego (mejorada)
├── 📄 style.css               # Estilos
├── 📄 preguntas.json          # ✨ NUEVO: Base de datos de preguntas
├── 📄 MEJORAS_IMPLEMENTADAS.md # ✨ NUEVO: Documentación de mejoras
├── 📄 README.md               # Este archivo
└── 📁 assets/
    ├── 🖼️ fondo.jpg            # Fondo pantalla inicio
    ├── 🖼️ fondo 2.jpg          # Fondo pantalla preguntas
    ├── 🎵 shallow.mp3          # Música de fondo
    └── 🎵 Tonto con Tiempo.mp3 # Audio alternativo
```

## 🎮 Características

### Funcionalidades Principales
- ✅ 10 preguntas personalizadas
- ✅ Cronómetro de 10 segundos por pregunta
- ✅ Síntesis de voz en español (con fallback)
- ✅ Feedback visual inmediato (correcto/incorrecto)
- ✅ Música de fondo
- ✅ Sonido de reloj "tick-tack"
- ✅ Sistema de puntaje (10 puntos por respuesta correcta)
- ✅ Mensajes personalizados según resultado

### Mejoras v2.0
- ✅ Carga dinámica desde JSON
- ✅ Historial de intentos persistente
- ✅ Estadísticas: mejor puntaje, promedio, total intentos
- ✅ Interfaz de estadísticas en resultados
- ✅ Validación completa de datos
- ✅ Compatible con navegadores sin TTS/AudioContext
- ✅ Manejo robusto de errores

## 🔧 Personalización

### Agregar/Editar Preguntas

Edita el archivo `preguntas.json`:

```json
{
    "id": 11,
    "pregunta": "Tu pregunta aquí",
    "opciones": {
        "A": "Primera opción",
        "B": "Segunda opción",
        "C": "Tercera opción"
    },
    "correcta": "A"
}
```

### Cambiar Música de Fondo

En `index.html` línea 117:
```html
<audio id="audio-quiz" src="assets/tu-cancion.mp3"></audio>
```

### Cambiar Fondo de Pantalla

Reemplaza los archivos en `assets/`:
- `fondo.jpg` - Pantalla de bienvenida
- `fondo 2.jpg` - Pantalla de preguntas

## 📊 Persistencia de Datos

El quiz guarda automáticamente:
- Puntaje de cada intento
- Fecha y hora
- Estadísticas calculadas

### Ver Historial (Consola del Navegador)
```javascript
const historial = JSON.parse(localStorage.getItem('quiz_san_valentin_historial'));
console.table(historial);
```

### Limpiar Historial
Usa el botón "🗑️ Limpiar historial" en la pantalla de resultados, o desde la consola:
```javascript
localStorage.removeItem('quiz_san_valentin_historial');
```

## 🌐 Compatibilidad

| Característica | Chrome | Firefox | Safari | Edge |
|---------------|--------|---------|--------|------|
| Quiz básico | ✅ | ✅ | ✅ | ✅ |
| Síntesis de voz | ✅ | ⚠️ | ✅ | ✅ |
| AudioContext | ✅ | ✅ | ⚠️ | ✅ |
| localStorage | ✅ | ✅ | ✅ | ✅ |
| Carga JSON | ✅ | ✅ | ✅ | ✅ |

⚠️ = Funciona con limitaciones o voces diferentes

## 🐛 Solución de Problemas

### Las preguntas no cargan
- Verifica que `preguntas.json` esté en la misma carpeta que `index.html`
- Abre la consola (F12) y busca mensajes de error
- El sistema usará preguntas de fallback automáticamente

### No se escucha la voz
- Web Speech API puede no estar disponible en tu navegador
- El quiz funcionará normalmente sin voz
- Intenta con Chrome/Edge para mejor compatibilidad

### El historial no se guarda
- Verifica que las cookies/localStorage estén habilitadas
- Modo incógnito puede deshabilitar localStorage
- El quiz funcionará normalmente sin persistencia

## 💡 Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Animaciones y diseño responsive
- **JavaScript ES6+** - Lógica del juego
  - Async/Await
  - Fetch API
  - Classes
  - Arrow functions
- **Web Speech API** - Síntesis de voz
- **Web Audio API** - Efectos de sonido
- **localStorage API** - Persistencia de datos

## 📱 Diseño Responsive

- Formato 9:16 (tipo Instagram Stories)
- Optimizado para móviles y tablets
- Máximo ancho: 420px
- Altura adaptativa con `dvh` (dynamic viewport height)

## 📈 Estadísticas del Proyecto

- **Líneas de código:** ~2,100
- **Preguntas incluidas:** 10
- **Tiempo promedio de juego:** 2-3 minutos
- **Archivos multimedia:** 4 (2 imágenes + 2 audios)

## 🔜 Posibles Mejoras Futuras

- [ ] Backend con base de datos real (Firebase/MongoDB)
- [ ] Sistema de ranking/leaderboard
- [ ] Compartir resultados en redes sociales
- [ ] Múltiples categorías de preguntas
- [ ] Modo multijugador
- [ ] Animaciones más elaboradas
- [ ] PWA (Progressive Web App)

## 👨‍💻 Desarrollo

```bash
# Clonar el proyecto
git clone [repository-url]

# Abrir con servidor local (opcional)
python -m http.server 8000
# o
npx serve

# Abrir en navegador
http://localhost:8000
```

## 📄 Licencia

Proyecto personal - Uso libre

## 🙏 Créditos

- Desarrollado con ❤️ para San Valentín 2026
- Música: Shallow (incluida en assets)
- Diseño: Inspirado en formato vertical móvil

---

**Versión 2.0** - Actualizado el 8 de febrero de 2026  
**Estado:** ✅ Totalmente funcional con mejoras implementadas
