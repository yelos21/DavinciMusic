-- ============================================================
--  Práctica 5 · 5.5  5 funciones y 3 disparadores
--  Requiere haber ejecutado 01_datos.sql
--
--    psql "postgresql://.../practica_davinci" -f 06_funciones_disparadores.sql
-- ============================================================

DO $$
BEGIN
  IF current_database() NOT LIKE 'practica\_%' THEN
    RAISE EXCEPTION 'Este script solo se puede ejecutar en una base practica_*  (base actual: %)', current_database();
  END IF;
END $$;

\echo ''
\echo '=================================================='
\echo ' 5.5  5 FUNCIONES Y 3 DISPARADORES'
\echo '=================================================='

-- Tabla de auditoría que usará el disparador de precios
CREATE TABLE IF NOT EXISTS auditoria_precio_instrumento (
  id_auditoria    SERIAL PRIMARY KEY,
  id_instrumento  INTEGER NOT NULL REFERENCES instrumento(id_instrumento) ON DELETE CASCADE,
  precio_anterior NUMERIC(10,2) NOT NULL,
  precio_nuevo    NUMERIC(10,2) NOT NULL,
  cambiado_en     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

\echo ''
\echo '--- Función 1: fn_ingresos_venta ---'
CREATE OR REPLACE FUNCTION fn_ingresos_venta(p_venta INTEGER)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
  FROM detalle_venta
  WHERE id_venta = p_venta;
$$ LANGUAGE sql STABLE;

\echo '--- Función 2: fn_alumnos_por_clase ---'
CREATE OR REPLACE FUNCTION fn_alumnos_por_clase(p_clase INTEGER)
RETURNS TABLE (alumno TEXT, estado TEXT, costo NUMERIC) AS $$
  SELECT u.nombre || ' ' || COALESCE(u.apellido_paterno, ''),
         ic.estado_inscripcion,
         ic.costo_mensual_acordado
  FROM inscripcion_clase ic
  INNER JOIN cliente c ON c.id_cliente = ic.id_cliente
  INNER JOIN usuario u ON u.id_usuario = c.id_usuario
  WHERE ic.id_clase = p_clase
  ORDER BY 1;
$$ LANGUAGE sql STABLE;

\echo '--- Función 3: fn_validar_stock (para disparador) ---'
CREATE OR REPLACE FUNCTION fn_validar_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  SELECT stock_actual INTO v_stock
  FROM instrumento WHERE id_instrumento = NEW.id_instrumento;

  IF v_stock IS NULL THEN
    RAISE EXCEPTION 'El instrumento % no existe', NEW.id_instrumento;
  END IF;
  IF NEW.cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
  END IF;
  IF v_stock < NEW.cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente del instrumento %: hay %, se piden %',
      NEW.id_instrumento, v_stock, NEW.cantidad;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

\echo '--- Función 4: fn_descontar_stock (para disparador) ---'
CREATE OR REPLACE FUNCTION fn_descontar_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE instrumento
  SET stock_actual = stock_actual - NEW.cantidad
  WHERE id_instrumento = NEW.id_instrumento;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

\echo '--- Función 5: fn_auditar_precio (para disparador) ---'
CREATE OR REPLACE FUNCTION fn_auditar_precio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.precio_venta <> OLD.precio_venta THEN
    INSERT INTO auditoria_precio_instrumento (id_instrumento, precio_anterior, precio_nuevo)
    VALUES (NEW.id_instrumento, OLD.precio_venta, NEW.precio_venta);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

\echo ''
\echo '--- Disparador 1: validar stock antes de vender ---'
-- Silencia el aviso "trigger does not exist, skipping"
SET client_min_messages = warning;
DROP TRIGGER IF EXISTS trg_validar_stock ON detalle_venta;
CREATE TRIGGER trg_validar_stock
BEFORE INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_validar_stock();

\echo '--- Disparador 2: descontar inventario al vender ---'
DROP TRIGGER IF EXISTS trg_descontar_stock ON detalle_venta;
CREATE TRIGGER trg_descontar_stock
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_descontar_stock();

\echo '--- Disparador 3: auditar cambios de precio ---'
DROP TRIGGER IF EXISTS trg_auditar_precio ON instrumento;
CREATE TRIGGER trg_auditar_precio
AFTER UPDATE ON instrumento
FOR EACH ROW EXECUTE FUNCTION fn_auditar_precio();

-- Vuelve a mostrar los NOTICE de la demostración
SET client_min_messages = notice;

\echo ''
\echo '--- Funciones y disparadores registrados ---'
SELECT p.proname AS funcion
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname LIKE 'fn\_%'
ORDER BY 1;

SELECT event_object_table AS tabla, trigger_name AS disparador,
       action_timing AS momento, event_manipulation AS evento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY 1, 2;

\echo ''
\echo '=================================================='
\echo ' PRUEBA DE FUNCIONES Y DISPARADORES'
\echo '=================================================='

DO $$
DECLARE
  v_stock_antes   INTEGER;
  v_stock_despues INTEGER;
  v_venta         INTEGER;
  v_total         NUMERIC;
  v_auditoria     RECORD;
  v_alumno        RECORD;
BEGIN
  SELECT stock_actual INTO v_stock_antes FROM instrumento WHERE id_instrumento = 1;

  -- Función 1
  v_total := fn_ingresos_venta(1);
  RAISE NOTICE 'FUNCIÓN fn_ingresos_venta(1) = %', v_total;

  -- Función 2
  FOR v_alumno IN SELECT * FROM fn_alumnos_por_clase(1) LOOP
    RAISE NOTICE 'FUNCIÓN fn_alumnos_por_clase(1) -> % (%) $%',
      v_alumno.alumno, v_alumno.estado, v_alumno.costo;
  END LOOP;

  -- Disparador de descuento de stock
  INSERT INTO venta (id_cliente, id_administrador, metodo_pago)
  VALUES (1, 1, 'efectivo')
  RETURNING id_venta INTO v_venta;

  INSERT INTO detalle_venta (id_venta, id_instrumento, cantidad, precio_unitario)
  VALUES (v_venta, 1, 3, 3500.00);

  SELECT stock_actual INTO v_stock_despues FROM instrumento WHERE id_instrumento = 1;
  RAISE NOTICE 'DISPARADOR trg_descontar_stock: stock del instrumento 1 pasó de % a % (se vendieron 3)',
    v_stock_antes, v_stock_despues;

  -- Disparador de validación: debe rechazar la venta
  BEGIN
    INSERT INTO detalle_venta (id_venta, id_instrumento, cantidad, precio_unitario)
    VALUES (v_venta, 2, 999999, 12500.00);
    RAISE NOTICE 'ADVERTENCIA: trg_validar_stock NO rechazó la venta de 999999 piezas';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RECHAZADO  venta de 999999 piezas -> %', SQLERRM;
  END;

  -- Disparador de auditoría de precios
  UPDATE instrumento SET precio_venta = precio_venta + 1 WHERE id_instrumento = 1;
  SELECT * INTO v_auditoria
  FROM auditoria_precio_instrumento
  ORDER BY id_auditoria DESC LIMIT 1;
  RAISE NOTICE 'DISPARADOR trg_auditar_precio: instrumento % pasó de % a %',
    v_auditoria.id_instrumento, v_auditoria.precio_anterior, v_auditoria.precio_nuevo;

  -- Limpieza: se quita la venta de prueba y se restauran stock y precio
  DELETE FROM detalle_venta WHERE id_venta = v_venta;
  DELETE FROM venta WHERE id_venta = v_venta;
  UPDATE instrumento
  SET stock_actual = v_stock_antes,
      precio_venta = precio_venta - 1
  WHERE id_instrumento = 1;

  RAISE NOTICE 'Limpieza: venta de prueba eliminada, stock y precio restaurados';
END $$;

\echo ''
\echo '--- Registros de auditoría que quedaron como evidencia ---'
SELECT * FROM auditoria_precio_instrumento ORDER BY id_auditoria;
