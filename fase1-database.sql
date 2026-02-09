-- ================================================
-- FASE 1: ESTRUCTURA DE BASE DE DATOS MVP
-- Sistema de Quizzes Personalizados
-- ================================================

-- Tabla de usuarios registrados (creadores de quizzes)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    quiz_code TEXT UNIQUE NOT NULL,
    estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'verificando', 'aprobado', 'rechazado')),
    metodo_pago TEXT,
    numero_operacion TEXT,
    comprobante_url TEXT,
    activo BOOLEAN DEFAULT false,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_pago TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de preguntas personalizadas (10 por usuario)
CREATE TABLE IF NOT EXISTS preguntas_personalizadas (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL CHECK (orden >= 1 AND orden <= 10),
    pregunta TEXT NOT NULL,
    opcion_a TEXT NOT NULL,
    opcion_b TEXT NOT NULL,
    opcion_c TEXT NOT NULL,
    correcta CHAR(1) NOT NULL CHECK (correcta IN ('A', 'B', 'C')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, orden)
);

-- Tabla de intentos (respuestas de los receptores)
CREATE TABLE IF NOT EXISTS intentos_personalizados (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id),
    nombre_participante TEXT,
    puntaje INTEGER NOT NULL CHECK (puntaje >= 0 AND puntaje <= 100),
    total_preguntas INTEGER DEFAULT 10,
    tiempo_total INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_quiz_code ON usuarios(quiz_code);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_preguntas_usuario_orden ON preguntas_personalizadas(usuario_id, orden);
CREATE INDEX IF NOT EXISTS idx_intentos_usuario ON intentos_personalizados(usuario_id, created_at DESC);

-- ================================================
-- POLÍTICAS RLS (Row Level Security)
-- ================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE preguntas_personalizadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE intentos_personalizados ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de lectura (necesarias para el sistema)
DROP POLICY IF EXISTS "Usuarios públicos lectura" ON usuarios;
CREATE POLICY "Usuarios públicos lectura" ON usuarios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Preguntas públicas lectura" ON preguntas_personalizadas;
CREATE POLICY "Preguntas públicas lectura" ON preguntas_personalizadas FOR SELECT USING (true);

-- Política pública de inserción para usuarios (registro)
DROP POLICY IF EXISTS "Usuarios públicos inserción" ON usuarios;
CREATE POLICY "Usuarios públicos inserción" ON usuarios FOR INSERT WITH CHECK (true);

-- Política pública de inserción para preguntas
DROP POLICY IF EXISTS "Preguntas públicas inserción" ON preguntas_personalizadas;
CREATE POLICY "Preguntas públicas inserción" ON preguntas_personalizadas FOR INSERT WITH CHECK (true);

-- Política pública para intentos
DROP POLICY IF EXISTS "Intentos públicos inserción" ON intentos_personalizados;
CREATE POLICY "Intentos públicos inserción" ON intentos_personalizados FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Intentos públicos lectura" ON intentos_personalizados;
CREATE POLICY "Intentos públicos lectura" ON intentos_personalizados FOR SELECT USING (true);

-- ================================================
-- FUNCIÓN PARA GENERAR CÓDIGO ÚNICO
-- ================================================

CREATE OR REPLACE FUNCTION generar_codigo_quiz()
RETURNS TEXT AS $$
DECLARE
    caracteres TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    codigo TEXT := '';
    i INTEGER;
    existe BOOLEAN;
BEGIN
    LOOP
        codigo := '';
        FOR i IN 1..8 LOOP
            codigo := codigo || substr(caracteres, floor(random() * length(caracteres) + 1)::int, 1);
        END LOOP;
        
        SELECT EXISTS(SELECT 1 FROM usuarios WHERE quiz_code = codigo) INTO existe;
        
        IF NOT existe THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCIÓN PARA OBTENER ESTADÍSTICAS DE UN USUARIO
-- ================================================

CREATE OR REPLACE FUNCTION obtener_stats_usuario(p_usuario_id UUID)
RETURNS TABLE(
    total_intentos BIGINT,
    puntaje_promedio NUMERIC,
    mejor_puntaje INTEGER,
    peor_puntaje INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_intentos,
        ROUND(AVG(puntaje), 1) as puntaje_promedio,
        MAX(puntaje) as mejor_puntaje,
        MIN(puntaje) as peor_puntaje
    FROM intentos_personalizados
    WHERE usuario_id = p_usuario_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VISTA PARA DASHBOARD DE USUARIOS
-- ================================================

CREATE OR REPLACE VIEW vista_usuarios_dashboard AS
SELECT 
    u.id,
    u.nombre,
    u.email,
    u.quiz_code,
    u.estado_pago,
    u.activo,
    u.fecha_registro,
    COUNT(DISTINCT p.id) as total_preguntas,
    COUNT(DISTINCT i.id) as total_intentos,
    COALESCE(ROUND(AVG(i.puntaje), 1), 0) as puntaje_promedio
FROM usuarios u
LEFT JOIN preguntas_personalizadas p ON u.id = p.usuario_id
LEFT JOIN intentos_personalizados i ON u.id = i.usuario_id
GROUP BY u.id, u.nombre, u.email, u.quiz_code, u.estado_pago, u.activo, u.fecha_registro;

-- ================================================
-- DATOS DE PRUEBA (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- ================================================

-- Usuario de prueba
-- INSERT INTO usuarios (nombre, email, quiz_code, estado_pago, activo) 
-- VALUES ('Usuario Prueba', 'prueba@test.com', 'test2026', 'aprobado', true);

-- ================================================
-- VERIFICACIÓN
-- ================================================
-- SELECT * FROM usuarios;
-- SELECT * FROM preguntas_personalizadas;
-- SELECT * FROM intentos_personalizados;
-- SELECT * FROM vista_usuarios_dashboard;
