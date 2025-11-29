/**
 * SIMULADOR DE CÁMARA IOT
 * Este script actúa como las cámaras físicas.
 * Envía datos al servidor Backend vía HTTP POST.
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/ingesta';

// Configuración de Cajas para simular
const CAJAS = [101, 102, 104]; // IDs de cajas abiertas

function generarTrafico() {
    // Seleccionar una caja al azar
    const cajaRandom = CAJAS[Math.floor(Math.random() * CAJAS.length)];
    
    // Generar número de personas aleatorio (0 a 10)
    // Hacemos que a veces suba mucho para provocar la alerta
    const personas = Math.floor(Math.random() * 9); 

    console.log(`🎥 CÁMARA DETECTA: ${personas} personas en Caja ${cajaRandom}. Enviando a Servidor...`);

    // ENVIAR PETICIÓN REAL AL SERVIDOR
    axios.post(API_URL, {
        id_caja: cajaRandom,
        personas: personas
    })
    .catch(error => {
        console.error("❌ Error conectando con el servidor Backend. ¿Está encendido?");
    });
}

// Enviar datos cada 2 segundos
console.log("---------------------------------------");
console.log("📡 INICIANDO TRANSMISIÓN DE CÁMARAS IOT");
console.log("---------------------------------------");
setInterval(generarTrafico, 2000);