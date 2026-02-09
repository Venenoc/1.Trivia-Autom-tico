# 🚀 FASE 1 MVP - Quiz San Valentín

## ✅ ¿Qué se implementó?

### 1. **Landing Page** (`landing.html`)
- 3 botones principales:
  - 🎨 **Crear Mi Quiz** (nuevo usuario)
  - 👀 **Ver Demo** (quiz normal)
  - 🔐 **Ya tengo cuenta** (próximamente)
- Diseño responsive y atractivo

### 2. **Sistema de Registro** (`registro.html`)
- Formulario de 3 pasos:
  1. Datos personales (nombre + email)
  2. Pago manual (Yape/Transferencia) + comprobante
  3. Confirmación con código único generado
- Subida de comprobante a Supabase Storage
- Estado "pendiente" hasta verificación manual

### 3. **Creación de Preguntas** (`crear-preguntas.html`)
- Formulario para 10 preguntas personalizadas
- Cada pregunta tiene:
  - Texto de la pregunta
  - 3 opciones (A, B, C)
  - Selección de respuesta correcta
- Barra de progreso
- Al finalizar: **link único** para compartir

### 4. **Base de Datos** (`fase1-database.sql`)
- Tabla `usuarios`:
  - Datos del creador
  - Código único (`quiz_code`)
  - Info de pago
  - Estado (activo/inactivo)
- Tabla `preguntas_personalizadas`:
  - 10 preguntas por usuario
  - Formato A/B/C
- Tabla `intentos_personalizados`:
  - Respuestas de los receptores
  - Puntajes guardados

### 5. **Sistema de URLs Únicas**
- Formato: `tudominio.com/#quiz/abc123`
- Detección automática del código
- Carga de preguntas personalizadas
- Mensaje: "Quiz creado por [Nombre]"

### 6. **API Extendida** (`supabase-config.js`)
**Nuevos métodos:**
- `generarCodigoUnico()` - Código aleatorio de 8 caracteres
- `crearUsuario()` - Registro con pago pendiente
- `obtenerUsuarioPorCodigo()` - Buscar por código único
- `obtenerPreguntasPersonalizadas()` - Cargar las 10 preguntas
- `guardarPreguntasPersonalizadas()` - Guardar batch de preguntas
- `guardarIntentoPersonalizado()` - Guardar respuesta del receptor
- `obtenerQuizPorCodigo()` - Cargar todo (usuario + preguntas)

### 7. **Detección en script.js**
- Lectura de URL (`#quiz/codigo` o `?q=codigo`)
- Carga inteligente: personalizado → normal → JSON
- Guardado correcto según tipo de quiz

---

## 📋 Instrucciones de Configuración

### PASO 1: Configurar Base de Datos

1. Ve a https://supabase.com/dashboard
2. Abre tu proyecto
3. Ve a **SQL Editor**
4. Abre `fase1-database.sql`
5. Copia **TODO** el contenido
6. Pégalo en Supabase SQL Editor
7. Click en **Run**

✅ Resultado esperado: `Success`

**Verificación:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('usuarios', 'preguntas_personalizadas', 'intentos_personalizados');
```
Deberías ver las 3 tablas.

### PASO 2: Configurar Storage para Comprobantes

1. En Supabase, ve a **Storage**
2. Click en **New bucket**
3. Nombre: `comprobantes`
4. **Public bucket**: ✅ (marcar) 
5. Allowed MIME types: `image/jpeg, image/png`
6. Max file size: `5 MB`
7. Click **Create bucket**

**Políticas necesarias:**
```sql
-- Permitir subida pública
CREATE POLICY "Cualquiera puede subir comprobantes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'comprobantes');

-- Permitir lectura pública
CREATE POLICY "Comprobantes públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'comprobantes');
```

### PASO 3: Verificar Credenciales

Abre `supabase-config.js` y verifica:
```javascript
const SUPABASE_URL = 'https://ooihwrvpfgafswnesgqu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...';  // Tu key actual
```

✅ Ya está configurado con tus credenciales.

### PASO 4: Iniciar Servidor Local

```powershell
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server -p 8000
```

### PASO 5: Probar el Sistema

#### A) Crear un Quiz (Flujo Completo)

1. **Abre:** `http://localhost:8000/landing.html`

2. **Click en "Crear Mi Quiz"**

3. **Completa Paso 1 - Datos:**
   - Nombre: Tu nombre
   - Email: tu@email.com
   - Click "Continuar al Pago"

4. **Completa Paso 2 - Pago:**
   - Método: Yape
   - Número de operación: 0012345678
   - Sube una imagen (cualquier imagen JPG/PNG)
   - Click "Confirmar y Continuar"

5. **Paso 3 - Confirmación:**
   - Verás tu código único (ej: `abc123xyz`)
   - Estado: "Tu pago está en revisión"

#### B) Aprobar Pago Manualmente

En Supabase SQL Editor:
```sql
-- Ver usuarios pendientes
SELECT nombre, email, quiz_code, estado_pago 
FROM usuarios 
WHERE estado_pago = 'pendiente';

-- Aprobar usuario (reemplaza 'abc123xyz' con el código real)
UPDATE usuarios 
SET activo = true, estado_pago = 'aprobado', fecha_pago = NOW()
WHERE quiz_code = 'abc123xyz';
```

#### C) Crear las 10 Preguntas

1. **Abre:** `http://localhost:8000/crear-preguntas.html?code=abc123xyz`
   (Reemplaza `abc123xyz` con el código real)

2. Completa las 10 preguntas:
   - Pregunta 1: "¿Cuál es mi color favorito?"
     - A: Azul ✓
     - B: Rojo
     - C: Verde
   - Pregunta 2, 3, 4... (completa las 10)

3. Click en "Guardar Quiz y Obtener Link"

4. **¡Éxito!** Verás tu link único:
   ```
   http://localhost:8000/#quiz/abc123xyz
   ```

#### D) Compartir y Probar

1. **Copia el link** generado

2. **Ábrelo en una nueva pestaña**

3. Verás:
   - "💘 Para Ti 💘"
   - "Quiz creado por [Tu Nombre]" ← Mensaje personalizado
   - Las 10 preguntas que creaste

4. **Juega el quiz** y verifica que funciona

5. En Supabase, verifica el intento guardado:
```sql
SELECT u.nombre, ip.puntaje, ip.created_at
FROM intentos_personalizados ip
JOIN usuarios u ON ip.usuario_id = u.id
ORDER BY ip.created_at DESC
LIMIT 5;
```

---

## 🎯 Flujos del Sistema

### Flujo 1: Nuevo Usuario
```
Landing → Crear cuenta → Datos → Pago → Confirmación
         ↓
    (Admin aprueba)
         ↓
    Crear preguntas → Link generado → Compartir
```

### Flujo 2: Receptor del Quiz
```
Recibe link (#quiz/codigo)
         ↓
    Abre el quiz
         ↓
    Ve mensaje: "Creado por [Nombre]"
         ↓
    Responde 10 preguntas
         ↓
    Ve resultado → Intento guardado
```

### Flujo 3: Demo
```
Landing → Ver Demo
         ↓
    Quiz normal (preguntas de tabla 'preguntas')
```

---

## 🔧 Archivos Modificados

### Nuevos Archivos:
- ✅ `landing.html` - Página principal con 3 botones
- ✅ `registro.html` - Formulario de registro + pago
- ✅ `crear-preguntas.html` - Formulario para las 10 preguntas
- ✅ `fase1-database.sql` - Schema completo de BD

### Archivos Modificados:
- ✅ `supabase-config.js` - +200 líneas (métodos para usuarios)
- ✅ `script.js` - +100 líneas (detección de URL y carga personalizada)

### Sin Cambios:
- ✅ `index.html` - Sigue funcionando como visor de quiz
- ✅ `style.css` - Sin modificaciones
- ✅ `preguntas.json` - Backup local

---

## 🎨 Personalización

### Cambiar Precio
En `registro.html` línea 267:
```html
<p><strong>Precio:</strong> S/ 10.00 (Promo San Valentín)</p>
```

### Cambiar Datos de Pago
En `registro.html` línea 268-269:
```html
<p><strong>Yape:</strong> 987654321</p>
<p><strong>BCP:</strong> 19X-XXXXXXX-X-XX</p>
```

### Cambiar Mensaje de Dedicatoria
En `script.js` línea 193:
```javascript
dedicatoriaElement.textContent = `Quiz creado por ${nombreCreador}`;
```

---

## 🐛 Troubleshooting

### Error: "No se pudo crear el usuario"
**Causa:** Problema con inserción en tabla `usuarios`
**Solución:**
```sql
-- Verificar que la tabla existe
SELECT * FROM usuarios LIMIT 1;

-- Verificar política RLS
SELECT * FROM pg_policies WHERE tablename = 'usuarios';
```

### Error: "Failed to upload comprobante"
**Causa:** Bucket `comprobantes` no existe o no tiene permisos
**Solución:**
1. Ve a Supabase → Storage
2. Verifica que existe bucket `comprobantes`
3. Verifica que está marcado como "Public"
4. Ejecuta las políticas del PASO 2

### Error: "No se encontró quiz con código"
**Causa:** Usuario no activado o código incorrecto
**Solución:**
```sql
-- Ver usuario por código
SELECT * FROM usuarios WHERE quiz_code = 'abc123xyz';

-- Verificar que activo = true
UPDATE usuarios SET activo = true WHERE quiz_code = 'abc123xyz';
```

### Error al crear preguntas: "Access denied"
**Causa:** URL sin parámetro `?code=xxx` o usuario no activo
**Solución:**
- URL correcta: `crear-preguntas.html?code=abc123xyz`
- Verifica que el usuario esté aprobado (activo = true)

---

## 📊 Consultas Útiles

### Ver todos los usuarios
```sql
SELECT 
    nombre, 
    email, 
    quiz_code, 
    estado_pago, 
    activo,
    fecha_registro
FROM usuarios
ORDER BY fecha_registro DESC;
```

### Ver quizzes completos (usuario + preguntas)
```sql
SELECT 
    u.nombre,
    u.quiz_code,
    COUNT(p.id) as total_preguntas
FROM usuarios u
LEFT JOIN preguntas_personalizadas p ON u.id = p.usuario_id
GROUP BY u.id, u.nombre, u.quiz_code;
```

### Ver intentos de un quiz
```sql
SELECT 
    u.nombre as creador,
    ip.puntaje,
    to_char(ip.created_at, 'DD/MM/YYYY HH24:MI') as fecha
FROM intentos_personalizados ip
JOIN usuarios u ON ip.usuario_id = u.id
WHERE u.quiz_code = 'abc123xyz'
ORDER BY ip.created_at DESC;
```

### Aprobar todos los pendientes (solo testing)
```sql
UPDATE usuarios 
SET activo = true, estado_pago = 'aprobado', fecha_pago = NOW()
WHERE estado_pago = 'pendiente';
```

---

## 🚀 Despliegue a Producción

### Opción 1: GitHub Pages (Recomendado)

1. **Sube archivos a GitHub:**
```bash
git init
git add .
git commit -m "Fase 1 MVP completo"
git branch -M main
git remote add origin https://github.com/tu-usuario/quiz-san-valentin.git
git push -u origin main
```

2. **Activa GitHub Pages:**
   - Ve a Settings → Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
   - Save

3. **Tu sitio estará en:**
```
https://tu-usuario.github.io/quiz-san-valentin/landing.html
```

### Opción 2: Vercel

```bash
npm install -g vercel
vercel
```

### Opción 3: Netlify

1. Arrastra la carpeta completa a netlify.com/drop
2. Tu sitio estará listo en segundos

---

## ✅ Checklist de Prueba

### Base de Datos:
- [ ] SQL ejecutado sin errores
- [ ] Tablas creadas (usuarios, preguntas_personalizadas, intentos_personalizados)
- [ ] Bucket `comprobantes` creado
- [ ] Políticas RLS configuradas

### Registro:
- [ ] Landing page carga correctamente
- [ ] Formulario de registro funciona
- [ ] Comprobante se sube a Supabase Storage
- [ ] Usuario se crea con estado "pendiente"
- [ ] Código único se genera correctamente

### Aprobación:
- [ ] Puedo ver usuarios pendientes en Supabase
- [ ] Puedo cambiar estado a "aprobado"
- [ ] Usuario se activa (activo = true)

### Creación de Preguntas:
- [ ] URL con `?code=xxx` funciona
- [ ] Solo usuarios activos pueden acceder
- [ ] Formulario de 10 preguntas carga
- [ ] Barra de progreso actualiza
- [ ] Preguntas se guardan en BD
- [ ] Link único se genera al final

### Quiz Personalizado:
- [ ] URL `#quiz/codigo` detecta el código
- [ ] Muestra mensaje "Quiz creado por [Nombre]"
- [ ] Carga las 10 preguntas personalizadas
- [ ] Funciona el juego completo
- [ ] Intento se guarda en `intentos_personalizados`

### Demo:
- [ ] URL sin código carga quiz normal
- [ ] Usa preguntas de tabla `preguntas`

---

## 🎉 ¡Fase 1 Completa!

**Lo que puedes hacer ahora:**
✅ Registrar usuarios con pago manual  
✅ Aprobar pagos desde Supabase  
✅ Usuarios crean sus 10 preguntas personalizadas  
✅ Sistema genera link único automáticamente  
✅ Receptores juegan sin registrarse  
✅ Intentos se guardan por usuario creador  
✅ Compatible con GitHub Pages (sin servidor)  

**Próximas Fases:**
🔜 **Fase 2**: Dashboard de estadísticas + Login con Supabase Auth  
🔜 **Fase 3**: Integración con Mercado Pago (pago automático)

---

**¿Funciona todo?** Perfecto, la Fase 1 está lista para producción. 🚀
