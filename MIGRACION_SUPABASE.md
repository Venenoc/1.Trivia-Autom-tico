# 🔄 Migración de localStorage a Supabase

## Cambios Necesarios en script.js

### PASO 1: Modificar la Carga de Preguntas

**ANTES (Línea ~160):**
```javascript
// Función asíncrona para cargar preguntas desde JSON
async function cargarPreguntasDesdeJSON() {
    // ... código actual que carga desde preguntas.json
}
```

**DESPUÉS:**
```javascript
// Función asíncrona para cargar preguntas desde Supabase
async function cargarPreguntasDesdeSupabase() {
    if (cargaEnProgreso) {
        console.log('Carga ya en progreso...');
        return false;
    }
    
    cargaEnProgreso = true;
    
    try {
        console.log('🔄 Cargando preguntas desde Supabase...');
        
        // Obtener preguntas desde Supabase
        bancoPreguntas = await supabaseQuiz.obtenerPreguntas();
        
        if (bancoPreguntas.length === 0) {
            throw new Error('No se pudieron cargar preguntas de Supabase');
        }
        
        // Validar preguntas
        const preguntasValidas = bancoPreguntas.filter(validarPregunta);
        
        if (preguntasValidas.length === 0) {
            throw new Error('No hay preguntas válidas');
        }
        
        bancoPreguntas = preguntasValidas;
        console.log(`✅ ${bancoPreguntas.length} preguntas cargadas desde Supabase`);
        cargaEnProgreso = false;
        return true;
        
    } catch (error) {
        console.error('❌ Error cargando desde Supabase:', error);
        
        // FALLBACK: Cargar desde JSON local
        console.log('⚠️ Intentando cargar desde JSON local...');
        return await cargarPreguntasDesdeJSON();
    }
}

// Mantener la función JSON como respaldo
async function cargarPreguntasDesdeJSON() {
    try {
        const response = await fetch('preguntas.json');
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const data = await response.json();
        const preguntasValidas = data.preguntas.filter(validarPregunta);
        
        if (preguntasValidas.length === 0) {
            throw new Error('No hay preguntas válidas en el JSON');
        }
        
        bancoPreguntas = preguntasValidas;
        console.log(`✅ ${bancoPreguntas.length} preguntas cargadas desde JSON`);
        cargaEnProgreso = false;
        return true;
    } catch (error) {
        console.error('❌ Error cargando JSON:', error);
        cargaEnProgreso = false;
        return false;
    }
}
```

---

### PASO 2: Modificar Guardar Intentos

**ANTES (Línea ~690):**
```javascript
// Guardar intento en persistencia
const guardado = persistencia.guardarIntento(puntaje);
if (guardado) {
    console.log('Intento guardado en historial');
}
```

**DESPUÉS:**
```javascript
// Guardar intento en Supabase
const intentoGuardado = await supabaseQuiz.guardarIntento(puntaje);
if (intentoGuardado) {
    console.log('✅ Intento guardado en Supabase con ID:', intentoGuardado.id);
    
    // También guardar en localStorage como respaldo
    if (STORAGE_AVAILABLE) {
        persistencia.guardarIntento(puntaje);
    }
}
```

---

### PASO 3: Actualizar Estadísticas

**ANTES (Línea ~702):**
```javascript
const stats = persistencia.obtenerEstadisticas();
```

**DESPUÉS:**
```javascript
// Obtener estadísticas de Supabase
const stats = await supabaseQuiz.obtenerEstadisticas();
```

---

### PASO 4: Modificar DOMContentLoaded

**ANTES (Línea ~764):**
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página cargada, inicializando...');
    
    try {
        await cargarPreguntasDesdeJSON();
        console.log('Preguntas pre-cargadas');
        
        if (STORAGE_AVAILABLE) {
            const stats = persistencia.obtenerEstadisticas();
            if (stats.totalIntentos > 0) {
                console.log(`📊 Estadísticas: ${stats.totalIntentos} intentos | Mejor: ${stats.mejorPuntaje} | Promedio: ${stats.promedio}`);
            }
        }
    } catch (error) {
        console.error('Error en inicialización:', error);
    }
});
```

**DESPUÉS:**
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Página cargada, inicializando...');
    
    try {
        // Probar conexión con Supabase
        const conexionOK = await supabaseQuiz.probarConexion();
        
        if (conexionOK) {
            console.log('✅ Conexión con Supabase OK');
            
            // Cargar preguntas desde Supabase
            await cargarPreguntasDesdeSupabase();
            
            // Obtener estadísticas de Supabase
            const stats = await supabaseQuiz.obtenerEstadisticas();
            if (stats.totalIntentos > 0) {
                console.log(`📊 Estadísticas globales: ${stats.totalIntentos} intentos | Mejor: ${stats.mejorPuntaje} | Promedio: ${stats.promedio}`);
            }
        } else {
            console.warn('⚠️ No hay conexión con Supabase, usando modo local');
            await cargarPreguntasDesdeJSON();
            
            if (STORAGE_AVAILABLE) {
                const stats = persistencia.obtenerEstadisticas();
                if (stats.totalIntentos > 0) {
                    console.log(`📊 Estadísticas locales: ${stats.totalIntentos} intentos`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
    }
});
```

---

### PASO 5: Actualizar Botón Empezar

**BUSCAR (Línea ~795):**
```javascript
// Cargar preguntas desde JSON si no están cargadas
if (bancoPreguntas.length === 0) {
    console.log('Cargando preguntas...');
    await cargarPreguntasDesdeJSON();
}
```

**REEMPLAZAR CON:**
```javascript
// Cargar preguntas si no están cargadas
if (bancoPreguntas.length === 0) {
    console.log('Cargando preguntas...');
    const cargado = await cargarPreguntasDesdeSupabase();
    if (!cargado) {
        await cargarPreguntasDesdeJSON();
    }
}
```

---

## 🎯 Funciones Adicionales (OPCIONAL)

### Guardar Respuestas Individuales

Agrega esto en la función `verificarRespuesta()`:

```javascript
// Después de verificar si es correcta/incorrecta
if (intentoActualId) {
    await supabaseQuiz.guardarRespuesta(
        intentoActualId,
        pregunta.id,
        respuestaSeleccionada,
        respuestaSeleccionada === pregunta.correcta,
        10 - tiempoRestante // tiempo que tomó responder
    );
}
```

### Agregar Variable Global para ID del Intento

En la sección de variables globales (~275):

```javascript
let preguntasJuego = [];
let preguntaActualIndex = 0;
let puntaje = 0;
let tiempoRestante = 10;
let intervaloTiempo = null;
let tiempoRespondido = false;
let intentoActualId = null; // ⭐ NUEVA VARIABLE
```

### Inicializar ID al Empezar Quiz

En la función del botón empezar, después de cambiar de sección:

```javascript
// Crear intento en Supabase al comenzar
intentoActualId = null; // Resetear
```

### Guardar Intento al Terminar

En `mostrarResultados()`, reemplazar:

```javascript
// Guardar intento en Supabase
const intentoGuardado = await supabaseQuiz.guardarIntento(puntaje);
if (intentoGuardado) {
    intentoActualId = intentoGuardado.id; // Guardar ID para referencia
    console.log('✅ Quiz completado y guardado con ID:', intentoActualId);
}
```

---

## 📋 Checklist de Migración

- [ ] 1. Ejecutar `supabase-setup.sql` en Supabase
- [ ] 2. Configurar credenciales en `supabase-config.js`
- [ ] 3. Actualizar `index.html` con scripts de Supabase
- [ ] 4. Agregar función `cargarPreguntasDesdeSupabase()`
- [ ] 5. Mantener `cargarPreguntasDesdeJSON()` como fallback
- [ ] 6. Modificar guardado de intentos para usar Supabase
- [ ] 7. Actualizar obtención de estadísticas
- [ ] 8. Modificar `DOMContentLoaded`
- [ ] 9. Actualizar botón empezar
- [ ] 10. (Opcional) Guardar respuestas individuales
- [ ] 11. Probar en navegador
- [ ] 12. Verificar datos en Supabase Dashboard

---

## 🧪 Pruebas

### En la Consola del Navegador

```javascript
// 1. Probar conexión
await supabaseQuiz.probarConexion();

// 2. Cargar preguntas
const preguntas = await supabaseQuiz.obtenerPreguntas();
console.log('Preguntas:', preguntas);

// 3. Guardar intento de prueba
const intento = await supabaseQuiz.guardarIntento(80);
console.log('Intento guardado:', intento);

// 4. Obtener estadísticas
const stats = await supabaseQuiz.obtenerEstadisticas();
console.log('Estadísticas:', stats);

// 5. Ver historial
const historial = await supabaseQuiz.obtenerHistorial();
console.log('Historial:', historial);
```

---

## ⚡ Ventajas del Enfoque Híbrido

✅ **Si Supabase está disponible:** Usa la base de datos en la nube
✅ **Si Supabase falla:** Usa JSON local + localStorage
✅ **Mejor experiencia de usuario:** Sin errores si no hay conexión
✅ **Datos sincronizados:** Todos comparten mismas preguntas

---

## 🔧 Debugging

Si algo no funciona:

1. **Verifica la consola del navegador** - F12
2. **Revisa que los scripts se cargan en orden:**
   - Primero: `supabase-js`
   - Segundo: `supabase-config.js`
   - Tercero: `script.js`
3. **Verifica credenciales** en `supabase-config.js`
4. **Revisa políticas RLS** en Supabase Dashboard
5. **Comprueba la red** en DevTools > Network

---

¿Necesitas más ayuda con algún paso específico?
