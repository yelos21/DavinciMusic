-- ============================================================
--  Práctica 5 · Tercer avance del proyecto
--  Ejecuta todo en orden: datos, 25 consultas, 15 JOIN,
--  15 agregadas, 5 vistas y 5 funciones con 3 disparadores.
--
--    psql "postgresql://.../practica_davinci" -f 00_todo.sql
--
--  Los \ir son rutas relativas a este archivo.
-- ============================================================

\timing off

\ir 01_datos.sql
\ir 02_consultas_simples.sql
\ir 03_joins.sql
\ir 04_agregadas.sql
\ir 05_vistas.sql
\ir 06_funciones_disparadores.sql

\echo ''
\echo '=================================================='
\echo ' TERCER AVANCE COMPLETO'
\echo '=================================================='
SELECT current_database() AS base,
       (SELECT COUNT(*) FROM instrumento)       AS instrumentos,
       (SELECT COUNT(*) FROM clase)             AS clases,
       (SELECT COUNT(*) FROM inscripcion_clase) AS inscripciones,
       (SELECT COUNT(*) FROM venta)             AS ventas,
       (SELECT COUNT(*) FROM pg_views
         WHERE schemaname = 'public' AND viewname LIKE 'v\_%') AS vistas,
       (SELECT COUNT(*) FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = 'public' AND p.proname LIKE 'fn\_%') AS funciones,
       (SELECT COUNT(*) FROM information_schema.triggers
         WHERE trigger_schema = 'public')        AS disparadores;
