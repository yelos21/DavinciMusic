-- 10. Actualizar el teléfono de un usuario
UPDATE usuario SET telefono = '3319876543' WHERE id_usuario = 1;

-- 11. Aumentar el stock de un instrumento tras recibir mercancía
UPDATE instrumento SET stock_actual = stock_actual + 10 WHERE id_instrumento = 1;

-- 12. Ajustar el costo mensual de una clase
UPDATE clase SET costo_mensual = 1000.00 WHERE id_clase = 1;

-- 13. Marcar un pago como pagado
UPDATE pago_clase SET estado_pago = 'Pagado', fecha_pago = NOW(), metodo_pago = 'Tarjeta'
WHERE id_pago_clase = 1;

-- 14. Cambiar el estado de una venta a completada
UPDATE venta SET estado_venta = 'Completada' WHERE id_venta = 1;

-- 15. Dar de baja a un maestro
UPDATE maestro SET activo = false WHERE id_maestro = 1;

-- 16. Actualizar el correo de un proveedor
UPDATE proveedor SET correo = 'nuevo_correo@instnorte.com' WHERE id_proveedor = 1;

-- 17. Cambiar el estado de una inscripción a "Baja"
UPDATE inscripcion_clase SET estado_inscripcion = 'Baja' WHERE id_inscripcion = 1;