# ⚡ INICIO RÁPIDO FASE 1 - 5 Minutos

## 🎯 Objetivo
Poner en marcha el sistema completo de quizzes personalizados con pago manual.

---

## 📝 PASO 1: Base de Datos (1 minuto)

1. Ve a: https://supabase.com/dashboard
2. Abre tu proyecto existente
3. Click en **SQL Editor** (menú izquierdo)
4. Click en **New Query**
5. Abre el archivo: `fase1-database.sql`
6. **CTRL+A** → **CTRL+C** (copiar todo)
7. **CTRL+V** en el editor SQL de Supabase
8. Click en **RUN** (esquina inferior derecha)

✅ **Resultado:** `Success. No rows returned`

---

## 💾 PASO 2: Storage (1 minuto)

1. En Supabase, click en **Storage** (menú izquierdo)
2. Click en **New bucket**
3. **Name:** `comprobantes`
4. ✅ Marcar **Public bucket**
5. Click en **Create bucket**
6. Click en el bucket `comprobantes`
7. Click en **Policies**
8. Click en **New Policy** → **For full customization**
9. **Policy name:** `public_upload`
10. **Policy definition:**
```sql
((bucket_id = 'comprobantes'::text))
```
11. **WITH CHECK expression:** (misma)
12. **Save policy**

---

## 🚀 PASO 3: Iniciar Servidor (10 segundos)

Abre **PowerShell** en la carpeta del proyecto:

```powershell
python -m http.server 8000
```

✅ **Resultado:** `Serving HTTP on :: port 8000`

---

## 🎮 PASO 4: Prueba Completa (3 minutos)

### A) Crear un Quiz

1. **Abre en el navegador:**
```
http://localhost:8000/landing.html
```

2. **Click en "Crear Mi Quiz"**

3. **Paso 1 - Datos:**
   - Nombre: Carlos
   - Email: carlos@test.com
   - Click "Continuar al Pago"

4. **Paso 2 - Pago:**
   - Método: Yape
   - Número: 0012345678
   - Comprobante: Sube cualquier imagen JPG
   - Click "Confirmar y Continuar"

5. **Anota el código generado:**
   - Ejemplo: `abc123xyz`
   - **GUÁRDALO**, lo necesitarás

### B) Aprobar el Pago

1. En Supabase → **SQL Editor**
2. Nueva query:
```sql
UPDATE usuarios 
SET activo = true, estado_pago = 'aprobado', fecha_pago = NOW()
WHERE quiz_code = 'abc123xyz';
```
(Reemplaza `abc123xyz` con tu código real)

3. **Run**

### C) Crear las Preguntas

1. **Abre en el navegador:**
```
http://localhost:8000/crear-preguntas.html?code=abc123xyz
```
(Reemplaza `abc123xyz` con tu código)

2. **Completa las 10 preguntas**
   - Pregunta 1: "¿Mi color favorito?"
   - Opción A: Azul (correcta)
   - Opción B: Rojo
   - Opción C: Verde
   - Marca A como correcta
   - Repite para las 10 preguntas

3. **Click "Guardar Quiz"**

4. **¡Éxito!** Copiarás tu link único:
```
http://localhost:8000/#quiz/abc123xyz
```

### D) Probar el Quiz

1. **Abre el link en nueva ventana**

2. Verás:
   - "💘 Para Ti 💘"
   - **"Quiz creado por Carlos"** ← Mensaje personalizado
   - Botón "¡Empezar!"

3. **Juega el quiz** con tus respuestas

4. **Verifica en Supabase:**
```sql
SELECT u.nombre, ip.puntaje, ip.created_at
FROM intentos_personalizados ip
JOIN usuarios u ON ip.usuario_id = u.id
ORDER BY ip.created_at DESC
LIMIT 5;
```

---

## ✅ Checklist de Verificación

- [ ] SQL ejecutado sin errores
- [ ] Bucket `comprobantes` creado y público
- [ ] Servidor corriendo en puerto 8000
- [ ] Landing page abre correctamente
- [ ] Registro completo funciona
- [ ] Usuario creado en BD
- [ ] Usuario aprobado manualmente
- [ ] Formulario de preguntas abre
- [ ] 10 preguntas guardadas
- [ ] Link único generado
- [ ] Quiz personalizado funciona
- [ ] Mensaje "Quiz creado por..." visible
- [ ] Intento guardado en BD

---

## 🎯 URLs Importantes

| Página | URL | Descripción |
|--------|-----|-------------|
| **Landing** | `localhost:8000/landing.html` | Página principal |
| **Registro** | `localhost:8000/registro.html` | Crear cuenta |
| **Crear Preguntas** | `localhost:8000/crear-preguntas.html?code=XXX` | Formulario de 10 preguntas |
| **Quiz Demo** | `localhost:8000/` | Quiz normal |
| **Quiz Personal** | `localhost:8000/#quiz/XXX` | Quiz con código único |

---

## 🐛 Problemas Comunes

### "No se pudo cargar la página"
**Solución:** Verifica que el servidor esté corriendo en puerto 8000

### "Access denied" en crear-preguntas.html
**Solución:** Asegúrate de:
1. Que la URL incluya `?code=xxx`
2. Que el usuario esté aprobado (`activo = true`)

### "No se encontró quiz con código"
**Solución:** Verifica en Supabase:
```sql
SELECT * FROM usuarios WHERE quiz_code = 'abc123xyz';
-- Debe mostrar activo = true
```

### Comprobante no se sube
**Solución:** 
1. Verifica que el bucket `comprobantes` existe
2. Verifica que es público
3. Verifica las políticas de Storage

---

## 📊 Consultas SQL Útiles

### Ver todos los usuarios
```sql
SELECT nombre, email, quiz_code, estado_pago, activo
FROM usuarios
ORDER BY fecha_registro DESC;
```

### Ver quizzes con preguntas
```sql
SELECT 
    u.nombre,
    u.quiz_code,
    COUNT(p.id) as total_preguntas
FROM usuarios u
LEFT JOIN preguntas_personalizadas p ON u.id = p.usuario_id
GROUP BY u.id
ORDER BY u.fecha_registro DESC;
```

### Aprobar todos (solo testing)
```sql
UPDATE usuarios 
SET activo = true, estado_pago = 'aprobado'
WHERE estado_pago = 'pendiente';
```

---

## 🎉 ¡Listo!

Si completaste todos los pasos, tienes:

✅ Sistema de registro funcionando  
✅ Pago manual con comprobantes  
✅ Generación automática de códigos únicos  
✅ Formulario de 10 preguntas personalizado  
✅ URLs únicas para compartir  
✅ Quiz personalizado funcionando  
✅ Guardado de intentos en base de datos  

**Siguiente paso:** Lee [README_FASE1.md](README_FASE1.md) para más detalles.

---

**⏱️ Tiempo total:** 5 minutos  
**🎯 Estado:** Fase 1 MVP completa  
**🚀 Listo para:** Desplegar a producción en GitHub Pages
