/**
 * QVISION - MÓDULO DE INGESTA DE CÁMARAS
 * Archivo: SimulaCamaras.js
 * Descripción: Simula la recepción de metadata de video (IA) y la envía al Backend.
 */

const axios = require('axios');

// DATOS QUE LAS CÁMARAS "ENVÍAN"
const DATOS_SIMULADOS = [
    {
        id_camara: "CAM-01-ENTRADA",
        zona: "Acceso Principal",
        timestamp: new Date(),
        metricas: { personas: 14, carritos: 5, mascarillas: true }
    },
    {
        id_camara: "CAM-02-CAJAS",
        zona: "Fila Rápida",
        timestamp: new Date(),
        metricas: { personas: 3, carritos: 1, mascarillas: true }
    }
];

async function iniciarIngesta() {
    console.log("---------------------------------------------------");
    console.log("🎥 QVISION: INICIANDO SISTEMA DE VISIÓN ARTIFICIAL (Simulador)");
    console.log("---------------------------------------------------");

    // Enviar al backend SQL (vía API) en lugar de Mongo
    const API = 'http://localhost:3000/api/captura';
    try {
        console.log("📡 Enviando lecturas simuladas al Backend...");
        // Mapear simulación a cajas 101 y 102 por simplicidad
        const payloads = [
            { id_caja: 101, personas: DATOS_SIMULADOS[0].metricas.personas },
            { id_caja: 102, personas: DATOS_SIMULADOS[1].metricas.personas },
        ];
        const results = await Promise.allSettled(
            payloads.map(p => axios.post(API, p))
        );
        const ok = results.filter(r => r.status === 'fulfilled').length;
        console.log(`💾 ÉXITO: Se enviaron ${ok}/${payloads.length} lecturas al backend.`);
    } catch (error) {
        console.log("❌ Error enviando lecturas al Backend:", error?.message || error);
        console.log("🔁 Tip: asegúrate de tener el servidor en http://localhost:3000 corriendo.");
    } finally {
        console.log("---------------------------------------------------");
        console.log("🏁 Proceso finalizado correctamente.");
    }
}

iniciarIngesta();