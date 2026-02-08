// ================================================
// QUIZ SAN VALENTÍN - JAVASCRIPT PRINCIPAL
// ================================================

console.log('App iniciada');

// ================================================
// SISTEMA DE PERSISTENCIA Y VALIDACIÓN
// ================================================

// Validar disponibilidad de localStorage
const STORAGE_AVAILABLE = (() => {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.warn('localStorage no disponible:', e);
        return false;
    }
})();

// Validar disponibilidad de Web Speech API
const SPEECH_AVAILABLE = 'speechSynthesis' in window;
if (!SPEECH_AVAILABLE) {
    console.warn('Web Speech API no disponible en este navegador');
}

// Validar disponibilidad de AudioContext
const AUDIO_CONTEXT_AVAILABLE = !!(window.AudioContext || window.webkitAudioContext);
if (!AUDIO_CONTEXT_AVAILABLE) {
    console.warn('AudioContext no disponible en este navegador');
}

// Clase para manejo de persistencia
class PersistenciaQuiz {
    constructor() {
        this.storageKey = 'quiz_san_valentin_historial';
    }
    
    // Guardar resultado de intento
    guardarIntento(puntaje, fecha = new Date()) {
        if (!STORAGE_AVAILABLE) return false;
        
        try {
            const historial = this.obtenerHistorial();
            historial.push({
                puntaje: puntaje,
                fecha: fecha.toISOString(),
                timestamp: fecha.getTime()
            });
            localStorage.setItem(this.storageKey, JSON.stringify(historial));
            return true;
        } catch (e) {
            console.error('Error guardando intento:', e);
            return false;
        }
    }
    
    // Obtener historial de intentos
    obtenerHistorial() {
        if (!STORAGE_AVAILABLE) return [];
        
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error leyendo historial:', e);
            return [];
        }
    }
    
    // Obtener estadísticas
    obtenerEstadisticas() {
        const historial = this.obtenerHistorial();
        if (historial.length === 0) {
            return {
                totalIntentos: 0,
                mejorPuntaje: 0,
                promedioRaw: 0,
                promedio: '0'
            };
        }
        
        const puntajes = historial.map(h => h.puntaje);
        const promedioRaw = puntajes.reduce((a, b) => a + b, 0) / puntajes.length;
        
        return {
            totalIntentos: historial.length,
            mejorPuntaje: Math.max(...puntajes),
            promedioRaw: promedioRaw,
            promedio: promedioRaw.toFixed(1)
        };
    }
    
    // Limpiar historial
    limpiarHistorial() {
        if (!STORAGE_AVAILABLE) return false;
        
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (e) {
            console.error('Error limpiando historial:', e);
            return false;
        }
    }
}

const persistencia = new PersistenciaQuiz();

// ================================================
// INICIALIZACIÓN DE VOCES (Web Speech API)
// ================================================

// Cargar voces disponibles (simplificado para evitar bloqueos)
let vocesDisponibles = [];
let vocesListas = false;

function cargarVoces() {
    if (!SPEECH_AVAILABLE) return;
    
    vocesDisponibles = window.speechSynthesis.getVoices();
    
    if (vocesDisponibles.length > 0) {
        vocesListas = true;
        console.log('✅ Voces cargadas:', vocesDisponibles.length);
        
        // Mostrar voces en español disponibles
        const vocesEspanol = vocesDisponibles.filter(v => v.lang.includes('es'));
        if (vocesEspanol.length > 0) {
            console.log('🗣️ Voces en español:', vocesEspanol.map(v => v.name).join(', '));
        }
    } else {
        console.log('⏳ Esperando voces...');
    }
}

// Cargar voces disponibles
if (SPEECH_AVAILABLE) {
    setTimeout(cargarVoces, 100);
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = cargarVoces;
    }
}

// ================================================
// BANCO DE PREGUNTAS (Cargado desde JSON)
// ================================================

let bancoPreguntas = [];
let cargaEnProgreso = false;

// Función para validar pregunta
function validarPregunta(pregunta) {
    if (!pregunta) return false;
    if (typeof pregunta.pregunta !== 'string' || pregunta.pregunta.trim() === '') return false;
    if (!pregunta.opciones || typeof pregunta.opciones !== 'object') return false;
    if (!pregunta.opciones.A || !pregunta.opciones.B || !pregunta.opciones.C) return false;
    if (!pregunta.correcta || !['A', 'B', 'C'].includes(pregunta.correcta)) return false;
    return true;
}

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
        const preguntasSupabase = await supabaseQuiz.obtenerPreguntas();
        
        if (!preguntasSupabase || preguntasSupabase.length === 0) {
            throw new Error('No se pudieron cargar preguntas de Supabase');
        }
        
        // Validar preguntas
        const preguntasValidas = preguntasSupabase.filter(validarPregunta);
        
        if (preguntasValidas.length === 0) {
            throw new Error('No hay preguntas válidas en Supabase');
        }
        
        bancoPreguntas = preguntasValidas;
        usandoSupabase = true;
        console.log(`✅ ${bancoPreguntas.length} preguntas cargadas desde Supabase`);
        cargaEnProgreso = false;
        return true;
        
    } catch (error) {
        console.error('❌ Error cargando desde Supabase:', error);
        usandoSupabase = false;
        
        // FALLBACK: Cargar desde JSON local
        console.log('⚠️ Intentando cargar desde JSON local...');
        cargaEnProgreso = false;
        return await cargarPreguntasDesdeJSON();
    }
}

// Función asíncrona para cargar preguntas desde JSON (FALLBACK)
async function cargarPreguntasDesdeJSON() {
    if (cargaEnProgreso) {
        console.log('Carga ya en progreso...');
        return false;
    }
    
    cargaEnProgreso = true;
    
    try {
        console.log('Cargando preguntas desde JSON...');
        const response = await fetch('preguntas.json');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validar estructura del JSON
        if (!data || !Array.isArray(data.preguntas)) {
            throw new Error('Estructura JSON inválida');
        }
        
        // Validar y filtrar preguntas
        const preguntasValidas = data.preguntas.filter(validarPregunta);
        
        if (preguntasValidas.length === 0) {
            throw new Error('No hay preguntas válidas en el JSON');
        }
        
        bancoPreguntas = preguntasValidas;
        console.log(`${bancoPreguntas.length} preguntas cargadas correctamente`);
        cargaEnProgreso = false;
        return true;
        
    } catch (error) {
        console.error('Error cargando preguntas:', error);
        
        // Fallback: Preguntas por defecto en caso de error
        bancoPreguntas = [
            {
                pregunta: "¿Dónde fue nuestra primera cita?",
                opciones: { A: "Un restaurante", B: "En casa", C: "Kantrika" },
                correcta: "C"
            },
            {
                pregunta: "¿Cuál es mi color favorito?",
                opciones: { A: "Negro", B: "Rojo", C: "Verde" },
                correcta: "A"
            },
            {
                pregunta: "¿Cuál es nuestra canción favorita?",
                opciones: { A: "Un reguetón", B: "Una canción pop", C: "Una canción de rock" },
                correcta: "A"
            },
            {
                pregunta: "¿Qué me gusta hacer en mi tiempo libre?",
                opciones: { A: "Leer libros", B: "Estudiar", C: "Ver películas" },
                correcta: "B"
            },
            {
                pregunta: "¿Cuál es mi comida favorita?",
                opciones: { A: "Pizza", B: "Pasta", C: "Pollo" },
                correcta: "C"
            }
        ];
        
        console.log('✅ Usando preguntas de fallback');
        cargaEnProgreso = false;
        usandoSupabase = false;
        return true;
    }
}

// ================================================
// REFERENCIAS A ELEMENTOS DEL DOM
// ================================================

// Botones
const btnEmpezar = document.getElementById('btn-empezar');
const btnSiguiente = document.getElementById('btn-siguiente');
const btnReiniciar = document.getElementById('btn-reiniciar');

console.log('Botón empezar encontrado:', btnEmpezar);

// Secciones
const seccionBienvenida = document.getElementById('bienvenida');
const seccionPregunta = document.getElementById('pregunta');
const seccionResultados = document.getElementById('resultados');

// Elementos de la pregunta
const numeroPregunta = document.querySelector('.numero-pregunta');
const preguntaTexto = document.querySelector('.pregunta-texto');
const opcionesBotones = document.querySelectorAll('.opcion-btn');

// Puntaje
const puntajeNumero = document.querySelector('.puntaje-numero');
const puntajeFinalNumero = document.querySelector('.puntaje-final-numero');
const mensajeResultado = document.querySelector('.mensaje-resultado');
const intentoNumero = document.querySelector('.intento-numero');

// Contador de tiempo
const tiempoNumero = document.querySelector('.tiempo-numero');
const cronometroProgreso = document.querySelector('.cronometro-progreso');

// Audio del quiz
const audioQuiz = document.getElementById('audio-quiz');

// ================================================
// VARIABLES GLOBALES DEL JUEGO
// ================================================

let preguntasJuego = [];
let preguntaActualIndex = 0;
let puntaje = 0;
let tiempoRestante = 10;
let intervaloTiempo = null;
let tiempoRespondido = false;
let numeroIntento = 1;
let intentoActualId = null; // ID del intento en Supabase
let usandoSupabase = false; // Flag para saber si Supabase está disponible

// Audio Context para el sonido de reloj
let audioContext = null;
let intervaloClic = null;

// Función para hacer sonido de tic-tac (con validación de compatibilidad)
function hacerTicTac() {
    if (!AUDIO_CONTEXT_AVAILABLE) {
        return; // Silenciosamente no hacer nada si no hay soporte
    }
    
    try {
        if (!audioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                return;
            }
            audioContext = new AudioContextClass();
        }
        
        // Validar que el contexto esté en estado válido
        if (audioContext.state === 'closed') {
            return;
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.warn('Error en sonido de reloj:', error);
        // No propagar el error, solo advertir
    }
}

function iniciarSonidoReloj() {
    hacerTicTac(); // Primer tic inmediato
    intervaloClic = setInterval(() => {
        hacerTicTac();
    }, 1000);
}

function detenerSonidoReloj() {
    if (intervaloClic) {
        clearInterval(intervaloClic);
        intervaloClic = null;
    }
}

// ================================================
// FUNCIONES DE NAVEGACIÓN
// ================================================

function cambiarSeccion(seccionActual, seccionNueva) {
    seccionActual.classList.remove('active');
    seccionNueva.classList.add('active');
    console.log('Cambio de sección realizado');
}

// ================================================
// FUNCIONES DE GESTIÓN DE PREGUNTAS
// ================================================

// Función para leer texto con voz (con validación y compatibilidad)
function leerTexto(texto) {
    // Validar entrada
    if (!texto || typeof texto !== 'string' || texto.trim() === '') {
        console.warn('Texto inválido para síntesis de voz');
        return;
    }
    
    // Verificar disponibilidad de Speech API
    if (!SPEECH_AVAILABLE) {
        console.log('TTS no disponible:', texto);
        return; // Silenciosamente no hacer nada
    }
    
    try {
        // Cancelar cualquier síntesis en progreso
        window.speechSynthesis.cancel();
        
        setTimeout(() => {
            try {
                const utterance = new SpeechSynthesisUtterance(texto);
                utterance.lang = 'es-ES';
                utterance.rate = 1.0;
                utterance.pitch = 1.2;
                utterance.volume = 1;
                
                // Manejador de errores para utterance (ignorar interrupciones normales)
                utterance.onerror = (event) => {
                    // Ignorar error "interrupted" porque es normal cuando cancelamos propositalmente
                    if (event.error === 'interrupted') {
                        return; // No mostrar nada, es comportamiento esperado
                    }
                    // Solo mostrar otros errores reales
                    if (event.error !== 'canceled') {
                        console.warn('⚠️ Error en síntesis de voz:', event.error);
                    }
                };
                
                // Manejador de inicio (opcional, para debug)
                utterance.onstart = () => {
                    console.log('📢 Leyendo:', texto.substring(0, 50) + '...');
                };
                
                // Obtener voces actualizadas
                let voices = window.speechSynthesis.getVoices();
                
                // Si no hay voces, intentar recargar
                if (!voices || voices.length === 0) {
                    console.log('Recargando voces...');
                    cargarVoces();
                    voices = window.speechSynthesis.getVoices();
                }
                
                if (voices && voices.length > 0) {
                    // Buscar específicamente voz de Google Español
                    const vozGoogle = voices.find(voice => 
                        voice.name.toLowerCase().includes('google') && 
                        (voice.lang.includes('es') || voice.name.toLowerCase().includes('español') || voice.name.toLowerCase().includes('spanish'))
                    );
                    
                    // Si no encuentra Google, buscar cualquier voz en español
                    const vozEspanol = voices.find(voice => voice.lang.includes('es'));
                    
                    if (vozGoogle) {
                        utterance.voice = vozGoogle;
                        console.log('🗣️ Usando voz:', vozGoogle.name);
                    } else if (vozEspanol) {
                        utterance.voice = vozEspanol;
                        console.log('🗣️ Usando voz:', vozEspanol.name);
                    } else {
                        console.log('🗣️ Usando voz por defecto');
                    }
                } else {
                    console.warn('⚠️ No se encontraron voces disponibles');
                }
                
                window.speechSynthesis.speak(utterance);
            } catch (error) {
                console.warn('Error al leer:', error);
            }
        }, 100);
    } catch (error) {
        console.warn('Error en leerTexto:', error);
    }
}

// Mezclar array aleatoriamente (Fisher-Yates)
function mezclarArray(array) {
    const nuevoArray = [...array];
    for (let i = nuevoArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nuevoArray[i], nuevoArray[j]] = [nuevoArray[j], nuevoArray[i]];
    }
    return nuevoArray;
}

// Seleccionar 10 preguntas aleatorias
function seleccionarPreguntasAleatorias() {
    preguntasJuego = mezclarArray(bancoPreguntas);
    console.log('Preguntas seleccionadas:', preguntasJuego.length);
}

// Cargar pregunta actual en la interfaz (con validación)
function cargarPregunta() {
    // Validar que hay preguntas y el índice es válido
    if (!preguntasJuego || preguntasJuego.length === 0) {
        console.error('No hay preguntas disponibles');
        return;
    }
    
    if (preguntaActualIndex < 0 || preguntaActualIndex >= preguntasJuego.length) {
        console.error('Índice de pregunta inválido:', preguntaActualIndex);
        return;
    }
    
    const pregunta = preguntasJuego[preguntaActualIndex];
    
    // Validar estructura de la pregunta
    if (!validarPregunta(pregunta)) {
        console.error('Pregunta inválida:', pregunta);
        return;
    }
    
    try {
        // Actualizar número de pregunta
        if (numeroPregunta) {
            numeroPregunta.textContent = preguntaActualIndex + 1;
        }
        
        // Actualizar texto de pregunta
        if (preguntaTexto) {
            preguntaTexto.textContent = pregunta.pregunta;
        }
        
        // Leer la pregunta con voz
        setTimeout(() => {
            leerTexto(pregunta.pregunta);
        }, 500);
        
        // Deshabilitar botón siguiente hasta que se responda
        if (btnSiguiente) {
            btnSiguiente.disabled = true;
            btnSiguiente.style.opacity = '0.5';
            btnSiguiente.style.cursor = 'not-allowed';
        }
        
        // Actualizar opciones
        if (opcionesBotones && opcionesBotones.length > 0) {
            opcionesBotones.forEach((boton, index) => {
                const letra = String.fromCharCode(65 + index); // A=65, B=66, C=67
                const textoOpcion = boton.querySelector('.texto');
                
                if (textoOpcion && pregunta.opciones[letra]) {
                    textoOpcion.textContent = pregunta.opciones[letra];
                }
                
                // Limpiar clases anteriores
                boton.classList.remove('correcta', 'incorrecta');
                boton.style.pointerEvents = 'auto';
            });
        }
        
        console.log(`Pregunta ${preguntaActualIndex + 1} cargada`);
    } catch (error) {
        console.error('Error cargando pregunta:', error);
    }
}

// ================================================
// FUNCIONES DEL CONTADOR DE TIEMPO
// ================================================

function iniciarContador() {
    tiempoRestante = 10;
    tiempoRespondido = false;
    tiempoNumero.textContent = tiempoRestante;
    cronometroProgreso.style.strokeDashoffset = '0';
    cronometroProgreso.classList.remove('alerta', 'critico');
    
    // Iniciar sonido de reloj (tic-tac)
    iniciarSonidoReloj();
    
    intervaloTiempo = setInterval(() => {
        tiempoRestante--;
        tiempoNumero.textContent = tiempoRestante;
        
        // Calcular el progreso del círculo (283 es la circunferencia)
        const progreso = (tiempoRestante / 10) * 283;
        cronometroProgreso.style.strokeDashoffset = 283 - progreso;
        
        // Cambiar color según el tiempo restante
        if (tiempoRestante <= 3) {
            cronometroProgreso.classList.add('critico');
            cronometroProgreso.classList.remove('alerta');
        } else if (tiempoRestante <= 5) {
            cronometroProgreso.classList.add('alerta');
        }
        
        // Si el tiempo se agota
        if (tiempoRestante <= 0 && !tiempoRespondido) {
            detenerContador();
            marcarRespuestaAutomatica();
        }
    }, 1000);
}

function detenerContador() {
    if (intervaloTiempo) {
        clearInterval(intervaloTiempo);
        intervaloTiempo = null;
    }
    
    // Detener sonido de reloj
    detenerSonidoReloj();
}

function marcarRespuestaAutomatica() {
    console.log('Tiempo agotado - mostrando respuesta correcta');
    const pregunta = preguntasJuego[preguntaActualIndex];
    
    // Detener lectura de voz si está activa
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    // Obtener el texto de la respuesta correcta
    const textoRespuestaCorrecta = pregunta.opciones[pregunta.correcta];
    
    opcionesBotones.forEach(btn => {
        if (btn.getAttribute('data-respuesta') === pregunta.correcta) {
            btn.classList.add('correcta');
        }
        btn.style.pointerEvents = 'none';
    });
    
    // Leer solo la respuesta correcta
    setTimeout(() => {
        leerTexto(`La respuesta es: ${textoRespuestaCorrecta}`);
    }, 300);
    
    // Habilitar botón siguiente
    btnSiguiente.disabled = false;
    btnSiguiente.style.opacity = '1';
    btnSiguiente.style.cursor = 'pointer';
}

// ================================================
// FUNCIONES DE MANEJO DE RESPUESTAS
// ================================================

function verificarRespuesta(botonSeleccionado) {
    const respuestaSeleccionada = botonSeleccionado.getAttribute('data-respuesta');
    const pregunta = preguntasJuego[preguntaActualIndex];
    
    // Detener lectura de voz si está activa
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    // Detener contador
    tiempoRespondido = true;
    detenerContador();
    
    // Verificar si es correcta
    if (respuestaSeleccionada === pregunta.correcta) {
        botonSeleccionado.classList.add('correcta');
        puntaje += 10;
        if (puntajeNumero) {
            puntajeNumero.textContent = puntaje;
        }
        console.log('¡Correcto! +10 puntos');
        
        // Leer confirmación de respuesta correcta
        setTimeout(() => {
            leerTexto('Me conoces bien');
        }, 300);
    } else {
        botonSeleccionado.classList.add('incorrecta');
        console.log('Incorrecto');
        
        // Obtener el texto de la respuesta correcta
        const textoRespuestaCorrecta = pregunta.opciones[pregunta.correcta];
        
        // Mostrar la correcta
        opcionesBotones.forEach(btn => {
            if (btn.getAttribute('data-respuesta') === pregunta.correcta) {
                setTimeout(() => btn.classList.add('correcta'), 300);
            }
        });
        
        // Leer la respuesta correcta
        setTimeout(() => {
            leerTexto(`Debemos hablar. Es ${textoRespuestaCorrecta}`);
        }, 300);
    }
    
    // Deshabilitar opciones
    opcionesBotones.forEach(btn => {
        btn.style.pointerEvents = 'none';
    });
    
    // Habilitar botón siguiente
    btnSiguiente.disabled = false;
    btnSiguiente.style.opacity = '1';
    btnSiguiente.style.cursor = 'pointer';
}

// ================================================
// FUNCIONES DE NAVEGACIÓN DE PREGUNTAS
// ================================================

function siguientePregunta() {
    preguntaActualIndex++;
    
    if (preguntaActualIndex < preguntasJuego.length) {
        // Hay más preguntas
        cargarPregunta();
        iniciarContador();
    } else {
        // Quiz terminado
        mostrarResultados(); // Llamar sin await porque se maneja internamente
    }
}

async function mostrarResultados() {
    detenerContador();
    cambiarSeccion(seccionPregunta, seccionResultados);
    
    try {
        // Detener música de fondo
        if (audioQuiz) {
            audioQuiz.pause();
            audioQuiz.currentTime = 0;
        }
    } catch (error) {
        console.warn('Error deteniendo audio:', error);
    }
    
    // Guardar intento en Supabase o localStorage
    let stats;
    
    if (usandoSupabase) {
        try {
            const intentoGuardado = await supabaseQuiz.guardarIntento(puntaje);
            if (intentoGuardado) {
                intentoActualId = intentoGuardado.id;
                console.log('✅ Intento guardado en Supabase con ID:', intentoActualId);
            }
            
            // Obtener estadísticas de Supabase
            stats = await supabaseQuiz.obtenerEstadisticas();
            console.log('📊 Estadísticas de Supabase:', stats);
        } catch (error) {
            console.error('❌ Error guardando en Supabase:', error);
            // Fallback a localStorage
            const guardado = persistencia.guardarIntento(puntaje);
            if (guardado) {
                console.log('💾 Intento guardado en localStorage');
            }
            stats = persistencia.obtenerEstadisticas();
        }
    } else {
        // Usar localStorage
        const guardado = persistencia.guardarIntento(puntaje);
        if (guardado) {
            console.log('💾 Intento guardado en localStorage');
        }
        stats = persistencia.obtenerEstadisticas();
        console.log('📊 Estadísticas locales:', stats);
    }
    
    try {
        // Actualizar puntaje final
        if (puntajeFinalNumero) {
            puntajeFinalNumero.textContent = puntaje;
        }
        
        // Mensaje personalizado según puntaje
        let mensaje = '';
        if (puntaje >= 80) {
            mensaje = 'Felicidades, me conoces más de lo que crees… y por eso te amo aún más.';
        } else if (puntaje >= 50) {
            mensaje = 'Vas bien, todavía nos queda toda una vida para conocernos mejor.';
        } else {
            mensaje = 'No importa el puntaje, lo importante es que te amo.';
        }
        
        if (mensajeResultado) {
            mensajeResultado.textContent = mensaje;
        }
        
        // Mostrar información de intentos con estadísticas
        if (intentoNumero) {
            let textoIntento = '';
            if (stats.totalIntentos === 1) {
                textoIntento = 'Primer intento';
            } else {
                textoIntento = `Intento ${stats.totalIntentos} | Mejor: ${stats.mejorPuntaje} | Promedio: ${stats.promedio}`;
            }
            intentoNumero.textContent = textoIntento;
        }
        
        // Leer el resultado con voz
        setTimeout(() => {
            leerTexto(`Has obtenido ${puntaje} puntos. ${mensaje}`);
        }, 500);
        
        console.log(`Quiz terminado. Puntaje: ${puntaje}/100 | Total intentos: ${stats.totalIntentos}`);
    } catch (error) {
        console.error('Error mostrando resultados:', error);
    }
}

function reiniciarJuego() {
    // Reiniciar variables
    preguntaActualIndex = 0;
    puntaje = 0;
    if (puntajeNumero) {
        puntajeNumero.textContent = '0';
    }
    
    // Seleccionar nuevas preguntas
    seleccionarPreguntasAleatorias();
    
    // Volver a bienvenida
    cambiarSeccion(seccionResultados, seccionBienvenida);
    
    console.log('Juego reiniciado');
}

// ================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ================================================

// Cargar preguntas al inicio
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Página cargada, inicializando...');
    
    try {
        // Probar conexión con Supabase
        if (typeof supabaseQuiz !== 'undefined') {
            console.log('🔍 Probando conexión con Supabase...');
            const conexionOK = await supabaseQuiz.probarConexion();
            
            if (conexionOK) {
                console.log('✅ Conexión con Supabase establecida');
                
                // Cargar preguntas desde Supabase
                await cargarPreguntasDesdeSupabase();
                
                // Obtener estadísticas de Supabase
                try {
                    const stats = await supabaseQuiz.obtenerEstadisticas();
                    if (stats.totalIntentos > 0) {
                        console.log(`📊 Estadísticas globales: ${stats.totalIntentos} intentos | Mejor: ${stats.mejorPuntaje} | Promedio: ${stats.promedio}`);
                    }
                } catch (error) {
                    console.warn('⚠️ No se pudieron obtener estadísticas:', error);
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
        } else {
            console.warn('⚠️ Supabase no disponible, usando modo local');
            await cargarPreguntasDesdeJSON();
        }
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        // Último fallback
        try {
            await cargarPreguntasDesdeJSON();
        } catch (e) {
            console.error('❌ Error crítico cargando preguntas:', e);
        }
    }
});

// ================================================
// EVENT LISTENERS
// ================================================

console.log('Registrando event listeners...');

// Botón Empezar
if (btnEmpezar) {
    btnEmpezar.addEventListener('click', async () => {
        console.log('¡Click en botón empezar!');
        
        try {
            // Deshabilitar botón temporalmente para evitar doble click
            btnEmpezar.disabled = true;
            btnEmpezar.style.opacity = '0.5';
            
            // Cargar preguntas si no están cargadas
            if (bancoPreguntas.length === 0) {
                console.log('Cargando preguntas...');
                if (usandoSupabase || typeof supabaseQuiz !== 'undefined') {
                    const cargado = await cargarPreguntasDesdeSupabase();
                    if (!cargado) {
                        await cargarPreguntasDesdeJSON();
                    }
                } else {
                    await cargarPreguntasDesdeJSON();
                }
            }
            
            // Validar que hay preguntas disponibles
            if (bancoPreguntas.length === 0) {
                alert('Error: No se pudieron cargar las preguntas. Por favor recarga la página.');
                btnEmpezar.disabled = false;
                btnEmpezar.style.opacity = '1';
                return;
            }
            
            // Resetear ID de intento
            intentoActualId = null;
            
            // Seleccionar preguntas y cargar la primera
            seleccionarPreguntasAleatorias();
            cargarPregunta();
            
            // Cambiar a sección de pregunta
            cambiarSeccion(seccionBienvenida, seccionPregunta);
            
            // Reproducir audio con manejo de errores
            if (audioQuiz) {
                try {
                    audioQuiz.currentTime = 0;
                    await audioQuiz.play();
                } catch (error) {
                    console.warn('No se pudo reproducir audio:', error);
                    // Continuar sin música si falla
                }
            }
            
            // Iniciar contador
            iniciarContador();
            
            // Re-habilitar botón
            btnEmpezar.disabled = false;
            btnEmpezar.style.opacity = '1';
            
        } catch (error) {
            console.error('Error al iniciar quiz:', error);
            alert('Ocurrió un error al iniciar el quiz. Por favor intenta de nuevo.');
            btnEmpezar.disabled = false;
            btnEmpezar.style.opacity = '1';
        }
    });
    console.log('Event listener del botón empezar registrado');
} else {
    console.error('ERROR: No se encontró el botón empezar');
}

// Botón Siguiente
if (btnSiguiente) {
    btnSiguiente.addEventListener('click', () => {
        console.log('Siguiente pregunta...');
        siguientePregunta();
    });
} else {
    console.error('ERROR: No se encontró el botón siguiente');
}

// Botón Reiniciar
if (btnReiniciar) {
    btnReiniciar.addEventListener('click', () => {
        console.log('Reiniciando...');
        reiniciarJuego();
    });
} else {
    console.error('ERROR: No se encontró el botón reiniciar');
}

// Opciones de respuesta
opcionesBotones.forEach(boton => {
    boton.addEventListener('click', () => {
        // Verificar si ya respondió
        if (boton.classList.contains('correcta') || boton.classList.contains('incorrecta')) {
            return;
        }
        
        verificarRespuesta(boton);
    });
});
