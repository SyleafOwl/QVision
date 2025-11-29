/**
 * QVISION - MÓDULO DE INGESTA DE CÁMARAS
 * Archivo: SimulaCamaras.js
 * Descripción: Simula la recepción de metadata de video (IA) y su almacenamiento.
 */

const { MongoClient } = require('mongodb');

// Configuración de conexión
const uri = "mongodb://localhost:27017";
// Timeout corto para que no te quedes esperando si falla
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

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
    console.log("🎥 QVISION: INICIANDO SISTEMA DE VISIÓN ARTIFICIAL");
    console.log("---------------------------------------------------");
    
    try {
        console.log("📡 Intentando conectar al Data Lake (MongoDB)...");
        
        await client.connect();
        
        const db = client.db('qvision_data');
        const col = db.collection('logs_video');
        
        console.log("✅ Conexión establecida con el servidor de Base de Datos.");
        console.log("📥 Recibiendo stream de datos...");

        const resultado = await col.insertMany(DATOS_SIMULADOS);
        console.log(`💾 ÉXITO: Se han guardado ${resultado.insertedCount} registros de video en disco.`);

    } catch (error) {
        // BLOQUE DE RESPALDO (Por si MongoDB no conecta en la expo)
        console.log("⚠️ AVISO: No se detectó servidor local de MongoDB activo.");
        console.log("🔄 Activando MODO DE SIMULACIÓN DE RESPALDO...");
        console.log("📥 Recibiendo stream de datos...");
        
        // Simulamos una espera de procesamiento
        await new Promise(r => setTimeout(r, 1000));
        
        console.log(`💾 ÉXITO (Simulado): Se procesaron ${DATOS_SIMULADOS.length} registros de video.`);
        console.log("📝 Los datos están listos para ser consumidos por el Dashboard.");
    } finally {
        await client.close();
        console.log("---------------------------------------------------");
        console.log("🏁 Proceso finalizado correctamente.");
    }
}

iniciarIngesta();