/**
 * QVISION - SCRIPT ADMINISTRATIVO (CUMPLE CRUD COMPLETO)
 * Descripción: Realiza operaciones de Mantenimiento (Update/Delete)
 * Requisito Rúbrica: "Operaciones CRUD utilizando MongoDB"
 */

const { MongoClient } = require('mongodb');

// --- PEGA AQUÍ TU STRING DE CONEXIÓN DE ATLAS ---
const uri = "mongodb+srv://admin:password1234@cluster.vrbepfq.mongodb.net/?appName=Cluster";

const client = new MongoClient(uri);

async function realizarMantenimiento() {
    try {
        console.log("🛠️ CONECTANDO A MONGODB PARA MANTENIMIENTO...");
        await client.connect();
        
        const db = client.db('qvision_db');
        const col = db.collection('cameralogs'); // Asegúrate que coincida con tu colección real

        // ---------------------------------------------------------
        // 1. UPDATE (Actualizar)
        // Escenario: Marcar registros antiguos como 'ARCHIVADO'
        // ---------------------------------------------------------
        console.log("🔄 Ejecutando UPDATE masivo...");
        const updateResult = await col.updateMany(
            { estado_caja: "CERRADA" }, // Condición: Cajas que estaban cerradas
            { $set: { auditado: true, nota: "Revisado por Admin" } } // Acción: Agregar campo 'auditado'
        );
        console.log(`   ✅ Se actualizaron ${updateResult.modifiedCount} documentos.`);

        // ---------------------------------------------------------
        // 2. DELETE (Borrar)
        // Escenario: Eliminar logs de prueba corruptos o vacíos
        // ---------------------------------------------------------
        console.log("🗑️ Ejecutando DELETE de limpieza...");
        const deleteResult = await col.deleteMany(
            { personas: { $lt: 0 } } // Condición: Si por error hay personas negativas
        );
        
        // Si no hay datos malos, borramos uno de prueba específico para demostrar que funciona
        if (deleteResult.deletedCount === 0) {
             console.log("   (No se encontraron datos corruptos, borrando logs de prueba antiguos...)");
             // Borra los logs muy antiguos (simulado)
             const deletePrueba = await col.deleteMany({ camera_id: "TEST-001" });
             console.log(`   ✅ Se eliminaron ${deletePrueba.deletedCount} registros de prueba.`);
        } else {
             console.log(`   ✅ Se eliminaron ${deleteResult.deletedCount} registros corruptos.`);
        }

        console.log("🏁 MANTENIMIENTO CRUD COMPLETADO.");

    } catch (error) {
        console.error("❌ Error en mantenimiento:", error);
    } finally {
        await client.close();
    }
}

realizarMantenimiento();