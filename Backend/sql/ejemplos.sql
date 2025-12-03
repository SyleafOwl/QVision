-- SELECT simple
SELECT camera_id, personas FROM camera_logs WHERE personas > 3 ORDER BY timestamp DESC LIMIT 5;

-- SELECT con GROUP BY (conteo por estado)
SELECT estado_caja, COUNT(*) AS total, SUM(personas) AS sum_personas
FROM camera_logs
GROUP BY estado_caja
ORDER BY total DESC;

-- UPDATE
UPDATE camera_logs SET estado_caja = "ABIERTA" WHERE estado_caja = "CERRADA";

-- DELETE
DELETE FROM camera_logs WHERE personas < 0;
