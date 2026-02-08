-- ================================================
-- CONFIGURACIÓN DE BASE DE DATOS SUPABASE
-- Quiz San Valentín
-- ================================================

-- Tabla para almacenar las preguntas del quiz
CREATE TABLE preguntas (
    id BIGSERIAL PRIMARY KEY,
    pregunta TEXT NOT NULL,
    opcion_a TEXT NOT NULL,
    opcion_b TEXT NOT NULL,
    opcion_c TEXT NOT NULL,
    correcta CHAR(1) NOT NULL CHECK (correcta IN ('A', 'B', 'C')),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para almacenar los resultados de cada intento
CREATE TABLE intentos (
    id BIGSERIAL PRIMARY KEY,
    puntaje INTEGER NOT NULL CHECK (puntaje >= 0 AND puntaje <= 100),
    total_preguntas INTEGER DEFAULT 10,
    tiempo_total INTEGER, -- en segundos
    user_id TEXT, -- opcional: identificador del usuario
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para almacenar respuestas individuales de cada intento
CREATE TABLE respuestas (
    id BIGSERIAL PRIMARY KEY,
    intento_id BIGINT REFERENCES intentos(id) ON DELETE CASCADE,
    pregunta_id BIGINT REFERENCES preguntas(id),
    respuesta_usuario CHAR(1) CHECK (respuesta_usuario IN ('A', 'B', 'C')),
    es_correcta BOOLEAN,
    tiempo_respuesta INTEGER, -- en segundos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_intentos_created_at ON intentos(created_at DESC);
CREATE INDEX idx_respuestas_intento_id ON respuestas(intento_id);
CREATE INDEX idx_preguntas_activa ON preguntas(activa);

-- ================================================
-- INSERTAR DATOS INICIALES (Las 10 preguntas)
-- ================================================

INSERT INTO preguntas (pregunta, opcion_a, opcion_b, opcion_c, correcta) VALUES
('¿Dónde fue nuestra primera cita?', 'Un restaurante', 'En casa', 'Kantrika', 'C'),
('¿Cuál es mi color favorito?', 'Negro', 'Rojo', 'Verde', 'A'),
('¿Cuál es nuestra canción favorita?', 'Un reguetón', 'Una canción pop', 'Una canción de rock', 'A'),
('¿Qué me gusta hacer en mi tiempo libre?', 'Leer libros', 'Estudiar', 'Ver películas', 'B'),
('¿Cuál es mi comida favorita?', 'Pizza', 'Pasta', 'Pollo', 'C'),
('¿Qué día nos conocimos?', 'Un lunes', 'Un jueves', 'Un sábado', 'B'),
('¿Cuál es mi película favorita?', 'Shallow', 'Una película de acción', 'Una película de terror', 'A'),
('¿Qué me regalaste en nuestro primer aniversario?', 'Flores', 'Un peluche', 'Un anillo', 'C'),
('¿Cuál es mi postre favorito?', 'Helado', 'Chessecake', 'Tiramisu', 'B'),
('¿Qué es lo que más amo de ti?', 'Tu sonrisa', 'Tu forma de ser', 'Todo de ti', 'C');

-- ================================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- ================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE intentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE respuestas ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer las preguntas activas
CREATE POLICY "Permitir lectura de preguntas activas" 
ON preguntas FOR SELECT 
USING (activa = true);

-- Política: Todos pueden insertar intentos
CREATE POLICY "Permitir insertar intentos" 
ON intentos FOR INSERT 
WITH CHECK (true);

-- Política: Todos pueden leer sus propios intentos
CREATE POLICY "Permitir lectura de intentos" 
ON intentos FOR SELECT 
USING (true);

-- Política: Todos pueden insertar respuestas
CREATE POLICY "Permitir insertar respuestas" 
ON respuestas FOR INSERT 
WITH CHECK (true);

-- Política: Todos pueden leer respuestas
CREATE POLICY "Permitir lectura de respuestas" 
ON respuestas FOR SELECT 
USING (true);

-- ================================================
-- FUNCIONES ÚTILES
-- ================================================

-- Función para obtener estadísticas generales
CREATE OR REPLACE FUNCTION get_estadisticas_globales()
RETURNS TABLE (
    total_intentos BIGINT,
    puntaje_promedio NUMERIC,
    puntaje_maximo INTEGER,
    puntaje_minimo INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_intentos,
        ROUND(AVG(puntaje), 1) as puntaje_promedio,
        MAX(puntaje) as puntaje_maximo,
        MIN(puntaje) as puntaje_minimo
    FROM intentos;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener las últimas 10 intentos
CREATE OR REPLACE FUNCTION get_ultimos_intentos(limite INTEGER DEFAULT 10)
RETURNS TABLE (
    id BIGINT,
    puntaje INTEGER,
    fecha TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.puntaje,
        i.created_at
    FROM intentos i
    ORDER BY i.created_at DESC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- TRIGGERS
-- ================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_preguntas_updated_at 
BEFORE UPDATE ON preguntas 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- VISTAS ÚTILES
-- ================================================

-- Vista para ver estadísticas por pregunta
CREATE OR REPLACE VIEW stats_por_pregunta AS
SELECT 
    p.id,
    p.pregunta,
    COUNT(r.id) as veces_respondida,
    SUM(CASE WHEN r.es_correcta THEN 1 ELSE 0 END) as respuestas_correctas,
    ROUND(
        (SUM(CASE WHEN r.es_correcta THEN 1 ELSE 0 END)::NUMERIC / 
        NULLIF(COUNT(r.id), 0)) * 100, 
        2
    ) as porcentaje_acierto
FROM preguntas p
LEFT JOIN respuestas r ON p.id = r.pregunta_id
GROUP BY p.id, p.pregunta
ORDER BY porcentaje_acierto DESC;

-- ================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ================================================

COMMENT ON TABLE preguntas IS 'Almacena las preguntas del quiz con sus opciones y respuesta correcta';
COMMENT ON TABLE intentos IS 'Registra cada intento completo del quiz con el puntaje obtenido';
COMMENT ON TABLE respuestas IS 'Detalle de cada respuesta individual en un intento';

COMMENT ON COLUMN preguntas.activa IS 'Permite desactivar preguntas sin eliminarlas';
COMMENT ON COLUMN intentos.tiempo_total IS 'Tiempo total que tomó completar el quiz en segundos';
COMMENT ON COLUMN respuestas.tiempo_respuesta IS 'Tiempo que tomó responder esta pregunta en segundos';
