# 🚀 Guía de Configuración de Supabase

## 📋 Índice
1. [Crear Cuenta en Supabase](#1-crear-cuenta-en-supabase)
2. [Crear Proyecto](#2-crear-proyecto)
3. [Configurar Base de Datos](#3-configurar-base-de-datos)
4. [Obtener Credenciales](#4-obtener-credenciales)
5. [Integrar con el Proyecto](#5-integrar-con-el-proyecto)
6. [Probar la Conexión](#6-probar-la-conexión)

---

## 1. Crear Cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"** 
3. Crea una cuenta con:
   - GitHub (recomendado)
   - Google
   - Email

---

## 2. Crear Proyecto

1. Una vez dentro, haz clic en **"New Project"**
2. Completa los datos:
   - **Name:** `quiz-san-valentin` (o el nombre que prefieras)
   - **Database Password:** Elige una contraseña segura (guárdala bien)
   - **Region:** Selecciona la más cercana a tu ubicación
   - **Pricing Plan:** Free (gratis para empezar)
3. Haz clic en **"Create new project"**
4. Espera 2-3 minutos mientras se crea el proyecto

---

## 3. Configurar Base de Datos

### 3.1 Acceder al Editor SQL

1. En el menú lateral, ve a **"SQL Editor"**
2. Haz clic en **"New query"**

### 3.2 Ejecutar el Script de Configuración

1. Abre el archivo `supabase-setup.sql` de este proyecto
2. Copia TODO el contenido
3. Pégalo en el editor SQL de Supabase
4. Haz clic en **"Run"** (▶️) en la esquina inferior derecha
5. Deberías ver el mensaje: **"Success. No rows returned"**

### 3.3 Verificar que se Crearon las Tablas

1. Ve a **"Table Editor"** en el menú lateral
2. Deberías ver 3 tablas:
   - `preguntas` (con 10 filas)
   - `intentos` (vacía)
   - `respuestas` (vacía)

---

## 4. Obtener Credenciales

### 4.1 URL del Proyecto

1. Ve a **"Settings"** (⚙️) en el menú lateral
2. Selecciona **"API"**
3. En la sección **"Project URL"**, copia la URL
   - Ejemplo: `https://xxxxxxxxxxxxx.supabase.co`

### 4.2 Anon Key (Clave Pública)

1. En la misma página de **API Settings**
2. En la sección **"Project API keys"**
3. Copia la **"anon public"** key
   - Es una clave larga que empieza con `eyJ...`

⚠️ **IMPORTANTE:** La `anon key` es segura para usar en el frontend, pero el `service_role` key NO lo incluyas nunca en el código del cliente.

---

## 5. Integrar con el Proyecto

### 5.1 Agregar la Librería de Supabase

Abre `index.html` y agrega ANTES del cierre de `</body>`:

```html
<!-- Librería de Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Configuración de Supabase -->
<script src="supabase-config.js"></script>

<!-- Script principal -->
<script src="script.js"></script>
```

### 5.2 Configurar las Credenciales

1. Abre el archivo `supabase-config.js`
2. Reemplaza los valores en las líneas 6-7:

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co'; // Tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Tu anon key
```

### 5.3 Modificar script.js para Usar Supabase

**Opción A: Reemplazar Completamente localStorage**

Busca en `script.js` la clase `PersistenciaQuiz` y reemplázala con:

```javascript
// Usar Supabase en lugar de localStorage
const persistencia = supabaseQuiz;
```

**Opción B: Usar Ambos (Híbrido)**

Mantén localStorage como respaldo si Supabase falla.

---

## 6. Probar la Conexión

### 6.1 Abrir la Consola del Navegador

1. Abre `index.html` en tu navegador
2. Presiona `F12` para abrir DevTools
3. Ve a la pestaña **"Console"**

### 6.2 Ejecutar Prueba Manual

En la consola, escribe:

```javascript
await supabaseQuiz.probarConexion();
```

Deberías ver:
```
✅ Conexión con Supabase exitosa
```

### 6.3 Probar Carga de Preguntas

```javascript
const preguntas = await supabaseQuiz.obtenerPreguntas();
console.log(preguntas);
```

Deberías ver un array con 10 preguntas.

---

## 📊 Características de la Base de Datos

### Tablas Creadas

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| **preguntas** | Preguntas del quiz | pregunta, opciones A/B/C, correcta |
| **intentos** | Registros de cada partida | puntaje, tiempo_total, fecha |
| **respuestas** | Detalle de cada respuesta | intento_id, pregunta_id, es_correcta |

### Funciones SQL Disponibles

1. **`get_estadisticas_globales()`**
   - Total de intentos
   - Puntaje promedio
   - Puntaje máximo y mínimo

2. **`get_ultimos_intentos(limite)`**
   - Obtiene los últimos N intentos

### Vistas Creadas

- **`stats_por_pregunta`**: Estadísticas de acierto por cada pregunta

---

## 🔒 Seguridad Configurada

✅ **Row Level Security (RLS)** activado en todas las tablas  
✅ Políticas de lectura pública para preguntas  
✅ Políticas de inserción para intentos y respuestas  
✅ Sin posibilidad de modificar o eliminar datos desde el cliente  

---

## 🎯 Métodos Disponibles en JavaScript

### Preguntas
```javascript
await supabaseQuiz.obtenerPreguntas()
await supabaseQuiz.agregarPregunta(pregunta)
```

### Intentos
```javascript
await supabaseQuiz.guardarIntento(puntaje, tiempoTotal)
await supabaseQuiz.obtenerUltimosIntentos(10)
await supabaseQuiz.obtenerHistorial()
```

### Respuestas
```javascript
await supabaseQuiz.guardarRespuesta(intentoId, preguntaId, respuesta, esCorrecta, tiempo)
```

### Estadísticas
```javascript
await supabaseQuiz.obtenerEstadisticas()
await supabaseQuiz.obtenerStatsPorPregunta()
```

---

## 🆘 Solución de Problemas

### Error: "Invalid API key"
- Verifica que copiaste correctamente el `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- Asegúrate de no tener espacios extras

### Error: "relation does not exist"
- Ejecuta nuevamente el script `supabase-setup.sql`
- Verifica en Table Editor que las tablas existen

### Error: "row-level security policy"
- Verifica que ejecutaste la sección de políticas RLS del SQL
- Ve a Authentication > Policies y verifica que existan

### No se guardan los datos
- Verifica la consola del navegador
- Asegúrate de que `supabase-config.js` se carga antes de `script.js`

---

## 📈 Dashboard de Supabase

Ve a tu proyecto en Supabase para:

- **Table Editor**: Ver y editar datos manualmente
- **SQL Editor**: Ejecutar consultas personalizadas
- **Database**: Ver estructura y relaciones
- **Logs**: Ver actividad en tiempo real

---

## 🚀 Próximos Pasos

Una vez que todo funcione:

1. ✅ Modifica `script.js` para usar Supabase en lugar de localStorage
2. ✅ Guarda respuestas individuales con `guardarRespuesta()`
3. ✅ Muestra estadísticas globales en la UI
4. ✅ Crea un dashboard de estadísticas
5. ✅ Agrega más preguntas desde Supabase

---

## 💡 Ventajas de Usar Supabase

- ✅ Datos persistentes entre dispositivos
- ✅ Estadísticas globales de todos los jugadores
- ✅ Respaldo automático de datos
- ✅ Fácil de agregar/editar preguntas
- ✅ Analytics detallados
- ✅ Escalable y gratis hasta 500MB

---

¿Necesitas ayuda? Revisa la [documentación oficial de Supabase](https://supabase.com/docs)
