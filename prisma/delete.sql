-- 18. Eliminar un horario específico de una clase
DELETE FROM horario_clase WHERE id_horario = 1;

-- 19. Eliminar un renglón de detalle de una orden de abastecimiento
DELETE FROM detalle_orden WHERE id_orden = 1 AND id_instrumento = 1;

-- 20. Eliminar pagos cancelados
DELETE FROM pago_clase WHERE estado_pago = 'Cancelado';

-- 21. Eliminar clases inactivas sin cupo disponible
DELETE FROM clase WHERE activa = false AND cupo_maximo = 0;

-- 22. Eliminar un proveedor dado de baja
DELETE FROM proveedor WHERE id_proveedor = 5 AND activo = false;

-- 23. Eliminar una inscripción específica
DELETE FROM inscripcion_clase WHERE id_inscripcion = 10;

-- 24. Eliminar un renglón de detalle de venta
DELETE FROM detalle_venta WHERE id_venta = 3 AND id_instrumento = 2;

-- 25. Eliminar una categoría de instrumento sin instrumentos asociados
DELETE FROM categoria_instrumento WHERE id_categoria = 8;