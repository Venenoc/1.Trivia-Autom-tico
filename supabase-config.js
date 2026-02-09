// ================================================
// CONFIGURACIÓN DE SUPABASE
// ================================================

// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Supabase
const SUPABASE_URL = 'https://jxehwjcvttmdiignotok.supabase.co'; // Ejemplo: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4ZWh3amN2dHRtZGlpZ25vdG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTM5MjAsImV4cCI6MjA4NjE2OTkyMH0.vyts5ih-qd4p_zKyKsn0GvCDgWJgbReNZ4MwlKrB1cg';

console.log('🔧 supabase-config.js cargando...');
console.log('🔧 window.supabase disponible?', typeof window.supabase);

// Inicializar cliente de Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('🔧 Cliente creado:', supabaseClient);

// ================================================
// CLASE PARA MANEJO DE BASE DE DATOS SUPABASE
// ================================================

class SupabaseQuiz {
    constructor() {
        this.client = supabaseClient;
    }
    
    // ==========================================
    // MÉTODOS PARA PREGUNTAS
    // ==========================================
    
    /**
     * Obtener todas las preguntas activas
     * @returns {Promise<Array>} Array de preguntas
     */
    async obtenerPreguntas() {
        try {
            const { data, error } = await this.client
                .from('preguntas')
                .select('*')
                .eq('activa', true)
                .order('id');
            
            if (error) throw error;
            
            // Transformar formato de base de datos al formato del quiz
            return data.map(p => ({
                id: p.id,
                pregunta: p.pregunta,
                opciones: {
                    A: p.opcion_a,
                    B: p.opcion_b,
                    C: p.opcion_c
                },
                correcta: p.correcta
            }));
        } catch (error) {
            console.error('Error obteniendo preguntas:', error);
            return [];
        }
    }
    
    /**
     * Agregar una nueva pregunta
     * @param {Object} pregunta - Objeto con la pregunta y opciones
     * @returns {Promise<Object>} Pregunta creada
     */
    async agregarPregunta(pregunta) {
        try {
            const { data, error } = await this.client
                .from('preguntas')
                .insert({
                    pregunta: pregunta.pregunta,
                    opcion_a: pregunta.opciones.A,
                    opcion_b: pregunta.opciones.B,
                    opcion_c: pregunta.opciones.C,
                    correcta: pregunta.correcta
                })
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error agregando pregunta:', error);
            return null;
        }
    }
    
    // ==========================================
    // MÉTODOS PARA INTENTOS
    // ==========================================
    
    /**
     * Guardar un intento completo del quiz
     * @param {number} puntaje - Puntaje obtenido (0-100)
     * @param {number} tiempoTotal - Tiempo total en segundos
     * @returns {Promise<Object>} Intento guardado con su ID
     */
    async guardarIntento(puntaje, tiempoTotal = null) {
        try {
            const { data, error } = await this.client
                .from('intentos')
                .insert({
                    puntaje: puntaje,
                    tiempo_total: tiempoTotal
                })
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Intento guardado en Supabase:', data.id);
            return data;
        } catch (error) {
            console.error('❌ Error guardando intento:', error);
            return null;
        }
    }
    
    /**
     * Guardar respuesta individual de una pregunta
     * @param {number} intentoId - ID del intento
     * @param {number} preguntaId - ID de la pregunta
     * @param {string} respuestaUsuario - Respuesta del usuario (A, B o C)
     * @param {boolean} esCorrecta - Si la respuesta es correcta
     * @param {number} tiempoRespuesta - Tiempo en segundos
     * @returns {Promise<boolean>} True si se guardó correctamente
     */
    async guardarRespuesta(intentoId, preguntaId, respuestaUsuario, esCorrecta, tiempoRespuesta) {
        try {
            const { error } = await this.client
                .from('respuestas')
                .insert({
                    intento_id: intentoId,
                    pregunta_id: preguntaId,
                    respuesta_usuario: respuestaUsuario,
                    es_correcta: esCorrecta,
                    tiempo_respuesta: tiempoRespuesta
                });
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error guardando respuesta:', error);
            return false;
        }
    }
    
    /**
     * Obtener estadísticas globales
     * @returns {Promise<Object>} Objeto con estadísticas
     */
    async obtenerEstadisticas() {
        try {
            const { data, error } = await this.client
                .rpc('get_estadisticas_globales');
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                const stats = data[0];
                return {
                    totalIntentos: parseInt(stats.total_intentos) || 0,
                    mejorPuntaje: stats.puntaje_maximo || 0,
                    promedioRaw: parseFloat(stats.puntaje_promedio) || 0,
                    promedio: stats.puntaje_promedio ? parseFloat(stats.puntaje_promedio).toFixed(1) : '0',
                    peorPuntaje: stats.puntaje_minimo || 0
                };
            }
            
            return {
                totalIntentos: 0,
                mejorPuntaje: 0,
                promedioRaw: 0,
                promedio: '0',
                peorPuntaje: 0
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {
                totalIntentos: 0,
                mejorPuntaje: 0,
                promedioRaw: 0,
                promedio: '0',
                peorPuntaje: 0
            };
        }
    }
    
    /**
     * Obtener últimos intentos
     * @param {number} limite - Cantidad de intentos a obtener
     * @returns {Promise<Array>} Array de intentos
     */
    async obtenerUltimosIntentos(limite = 10) {
        try {
            const { data, error } = await this.client
                .from('intentos')
                .select('id, puntaje, created_at')
                .order('created_at', { ascending: false })
                .limit(limite);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error obteniendo últimos intentos:', error);
            return [];
        }
    }
    
    /**
     * Obtener historial completo de intentos
     * @returns {Promise<Array>} Array con historial
     */
    async obtenerHistorial() {
        try {
            const { data, error } = await this.client
                .from('intentos')
                .select('puntaje, created_at')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Transformar al formato usado anteriormente
            return data.map(intento => ({
                puntaje: intento.puntaje,
                fecha: intento.created_at,
                timestamp: new Date(intento.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            return [];
        }
    }
    
    // ==========================================
    // MÉTODOS PARA ESTADÍSTICAS POR PREGUNTA
    // ==========================================
    
    /**
     * Obtener estadísticas por pregunta
     * @returns {Promise<Array>} Estadísticas de cada pregunta
     */
    async obtenerStatsPorPregunta() {
        try {
            const { data, error } = await this.client
                .from('stats_por_pregunta')
                .select('*');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error obteniendo stats por pregunta:', error);
            return [];
        }
    }
    
    // ==========================================
    // MÉTODO DE PRUEBA DE CONEXIÓN
    // ==========================================
    
    /**
     * Probar conexión con Supabase
     * @returns {Promise<boolean>} True si la conexión es exitosa
     */
    async probarConexion() {
        try {
            const { data, error} = await this.client
                .from('preguntas')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            console.log('✅ Conexión con Supabase exitosa');
            return true;
        } catch (error) {
            console.error('❌ Error de conexión con Supabase:', error);
            return false;
        }
    }
    
    // ==========================================
    // MÉTODOS PARA USUARIOS (FASE 1)
    // ==========================================
    
    /**
     * Generar código único para quiz
     * @returns {Promise<string>} Código único generado
     */
    async generarCodigoUnico() {
        try {
            const caracteres = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let codigo = '';
            let existe = true;
            
            while (existe) {
                codigo = '';
                for (let i = 0; i < 8; i++) {
                    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
                }
                
                // Verificar si ya existe
                const { data, error } = await this.client
                    .from('usuarios')
                    .select('id')
                    .eq('quiz_code', codigo)
                    .single();
                
                existe = !error && data !== null;
            }
            
            return codigo;
        } catch (error) {
            console.error('Error generando código:', error);
            return null;
        }
    }
    
    /**
     * Crear nuevo usuario
     * @param {Object} datos - Datos del usuario
     * @returns {Promise<Object>} Usuario creado
     */
    async crearUsuario(datos) {
        try {
            const { data, error } = await this.client
                .from('usuarios')
                .insert({
                    nombre: datos.nombre,
                    email: datos.email,
                    quiz_code: datos.quizCode,
                    metodo_pago: datos.metodoPago,
                    numero_operacion: datos.numeroOperacion,
                    comprobante_url: datos.comprobanteUrl,
                    estado_pago: 'aprobado', // Cambiado: simular pago aprobado automáticamente
                    activo: true // Cambiado: activar usuario inmediatamente
                })
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creando usuario:', error);
            return null;
        }
    }
    
    /**
     * Obtener usuario por código de quiz
     * @param {string} quizCode - Código del quiz
     * @returns {Promise<Object>} Usuario o null
     */
    async obtenerUsuarioPorCodigo(quizCode) {
        try {
            const { data, error } = await this.client
                .from('usuarios')
                .select('*')
                .eq('quiz_code', quizCode)
                .eq('activo', true)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error obteniendo usuario:', error);
            return null;
        }
    }
    
    /**
     * Obtener preguntas personalizadas de un usuario
     * @param {string} usuarioId - UUID del usuario
     * @returns {Promise<Array>} Array de preguntas
     */
    async obtenerPreguntasPersonalizadas(usuarioId) {
        try {
            const { data, error } = await this.client
                .from('preguntas_personalizadas')
                .select('*')
                .eq('usuario_id', usuarioId)
                .order('orden');
            
            if (error) throw error;
            
            return data.map(p => ({
                id: p.id,
                pregunta: p.pregunta,
                opciones: {
                    A: p.opcion_a,
                    B: p.opcion_b,
                    C: p.opcion_c
                },
                correcta: p.correcta
            }));
        } catch (error) {
            console.error('Error obteniendo preguntas personalizadas:', error);
            return [];
        }
    }
    
    /**
     * Guardar preguntas personalizadas de un usuario
     * @param {string} usuarioId - UUID del usuario
     * @param {Array} preguntas - Array de 10 preguntas
     * @returns {Promise<boolean>} True si se guardaron correctamente
     */
    async guardarPreguntasPersonalizadas(usuarioId, preguntas) {
        try {
            const preguntasFormato = preguntas.map((p, index) => ({
                usuario_id: usuarioId,
                orden: index + 1,
                pregunta: p.pregunta,
                opcion_a: p.opciones.A,
                opcion_b: p.opciones.B,
                opcion_c: p.opciones.C,
                correcta: p.correcta
            }));
            
            const { data, error } = await this.client
                .from('preguntas_personalizadas')
                .insert(preguntasFormato)
                .select();
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error guardando preguntas personalizadas:', error);
            return false;
        }
    }
    
    /**
     * Guardar intento personalizado
     * @param {string} usuarioId - UUID del dueño del quiz
     * @param {number} puntaje - Puntaje obtenido
     * @param {string} nombreParticipante - Nombre de quien responde
     * @param {number} tiempoTotal - Tiempo en segundos
     * @returns {Promise<Object>} Intento guardado
     */
    async guardarIntentoPersonalizado(usuarioId, puntaje, nombreParticipante = null, tiempoTotal = null) {
        try {
            const { data, error } = await this.client
                .from('intentos_personalizados')
                .insert({
                    usuario_id: usuarioId,
                    puntaje: puntaje,
                    nombre_participante: nombreParticipante,
                    tiempo_total: tiempoTotal
                })
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error guardando intento personalizado:', error);
            return null;
        }
    }
    
    /**
     * Obtener quiz completo por código
     * @param {string} quizCode - Código único del quiz
     * @returns {Promise<Object>} Objeto con usuario y preguntas
     */
    async obtenerQuizPorCodigo(quizCode) {
        try {
            const usuario = await this.obtenerUsuarioPorCodigo(quizCode);
            if (!usuario) {
                return null;
            }
            
            const preguntas = await this.obtenerPreguntasPersonalizadas(usuario.id);
            
            return {
                usuario: usuario,
                preguntas: preguntas
            };
        } catch (error) {
            console.error('Error obteniendo quiz completo:', error);
            return null;
        }
    }
}

// Exportar instancia global
window.supabaseQuiz = new SupabaseQuiz();
console.log('🔧 supabaseQuiz exportado:', window.supabaseQuiz);
