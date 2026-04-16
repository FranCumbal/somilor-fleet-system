-- ============================================================
-- SOMILOR — Datos de prueba (seed)
-- Ejecutar DESPUÉS de 001_create_tables.sql
-- ============================================================
USE SOMILOR;
GO

-- ── USUARIOS ──────────────────────────────────────────────
-- Contraseña para todos: Admin123! (hash bcrypt)
INSERT INTO usuarios (nombre, email, hashed_password, rol) VALUES
('Administrador SOMILOR', 'admin@somilor.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin'),
('Juan Morales',         'jmorales@somilor.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'operador');
GO

-- ── CHOFERES ──────────────────────────────────────────────
INSERT INTO choferes (nombre, apellido, cedula, licencia, categoria_licencia, telefono) VALUES
('Carlos',   'Mendoza',  '0912345678', 'L-00123', 'E',  '0991234567'),
('Luis',     'Ruiz',     '0923456789', 'L-00456', 'C',  '0992345678'),
('Marco',    'Arévalo',  '0934567890', 'L-00789', 'D',  '0993456789'),
('Kevin',    'Paredes',  '0945678901', 'L-01023', 'B',  '0994567890'),
('Pedro',    'Guerrero', '0956789012', 'L-01156', 'C',  '0995678901'),
('Roberto',  'Torres',   '0967890123', 'L-01289', 'E',  '0996789012'),
('Manuel',   'Ortega',   '0978901234', 'L-01422', 'D',  '0997890123'),
('Andrés',   'Salinas',  '0989012345', 'L-01555', 'C',  '0998901234');
GO

-- ── VEHÍCULOS ─────────────────────────────────────────────
INSERT INTO vehiculos (codigo, marca, modelo, anio, placa, tipo, estado, kilometraje_actual, nivel_combustible) VALUES
('VH-001', 'Toyota',   'Hilux 4x4',      2020, 'PCV-1234', 'camioneta',  'operativo', 45100, 88),
('VH-003', 'Isuzu',    'D-Max Pickup',   2019, 'GGA-5678', 'camioneta',  'operativo', 87320, 62),
('VH-005', 'Hino',     '300 Series',     2021, 'XXX-2024', 'volqueta',   'operativo', 31640, 45),
('VH-008', 'Ford',     'Ranger XL',      2022, 'ABD-0091', 'camioneta',  'operativo', 22890, 71),
('VH-009', 'Toyota',   'Fortuner 4x4',   2018, 'GDF-4432', 'camioneta',  'taller',    67400, 30),
('VH-012', 'Toyota',   'Hilux Doble Cab',2023, 'HJK-7821', 'camioneta',  'operativo', 22445, 18),
('EX-201', 'Caterpillar','336 GC',       2021, NULL,       'excavadora', 'operativo', 0,     55),
('BU-301', 'Komatsu',  'D65-18',         2020, NULL,       'buldocer',   'operativo', 0,     80);
GO

-- ── ASIGNACIONES ACTIVAS ──────────────────────────────────
INSERT INTO asignaciones (vehiculo_id, chofer_id, activa) VALUES
(1, 1, 1),  -- VH-001 → Carlos Mendoza
(2, 2, 1),  -- VH-003 → Luis Ruiz
(3, 3, 1),  -- VH-005 → Marco Arévalo
(4, 4, 1),  -- VH-008 → Kevin Paredes
(5, 5, 1),  -- VH-009 → Pedro Guerrero (en taller)
(6, 5, 1),  -- VH-012 → Pedro Guerrero
(7, 6, 1);  -- EX-201 → Roberto Torres
GO

-- ── TANQUEOS ─────────────────────────────────────────────
INSERT INTO tanqueos (vehiculo_id, chofer_id, fecha, litros, km_inicial, km_final, rendimiento_km_l, precio_litro, costo_total, es_anomalia) VALUES
(1, 1, DATEADD(hour,-2,GETUTCDATE()),  45, 45055, 45100, 9.0,  1.10, 49.50,  0),
(6, 5, DATEADD(hour,-4,GETUTCDATE()),  60, 22300, 22445, 2.4,  1.10, 66.00,  1),
(7, 6, DATEADD(day,-1,GETUTCDATE()),   80, NULL,  NULL,  NULL, 1.10, 88.00,  0),
(3, 3, DATEADD(day,-1,GETUTCDATE()),   55, 31200, 31640, 8.0,  1.10, 60.50,  0),
(2, 2, DATEADD(day,-2,GETUTCDATE()),   50, 86900, 87320, 8.4,  1.10, 55.00,  0),
(4, 4, DATEADD(day,-2,GETUTCDATE()),   40, 22500, 22890, 9.75, 1.10, 44.00,  0),
(8, 7, DATEADD(day,-3,GETUTCDATE()),   90, NULL,  NULL,  NULL, 1.10, 99.00,  0),
(1, 1, DATEADD(day,-3,GETUTCDATE()),   42, 44670, 45055, 9.17, 1.10, 46.20,  0);
GO

-- ── MANTENIMIENTOS ────────────────────────────────────────
INSERT INTO mantenimientos (vehiculo_id, tipo, estado, descripcion, fecha_programada, fecha_realizado, km_programado, km_realizado, costo) VALUES
(5, 'correctivo',  'en_proceso',  'Cambio de frenos delanteros',    DATEADD(day,-5,GETUTCDATE()), NULL,                      67000,  NULL,  250.00),
(2, 'preventivo',  'programado',  'Cambio de aceite 5W30',          DATEADD(day, 3,GETUTCDATE()), NULL,                      87500,  NULL,  NULL),
(7, 'preventivo',  'programado',  'Revisión sistema hidráulico',    DATEADD(day, 7,GETUTCDATE()), NULL,                      NULL,   NULL,  NULL),
(1, 'preventivo',  'completado',  'Alineación y balanceo',          DATEADD(day,-2,GETUTCDATE()), DATEADD(day,-2,GETUTCDATE()), 45000, 45100, 80.00),
(3, 'preventivo',  'completado',  'Cambio de llantas traseras',     DATEADD(month,-1,GETUTCDATE()), DATEADD(month,-1,GETUTCDATE()), 30000, 30200, 420.00),
(6, 'correctivo',  'programado',  'Revisión consumo combustible',   DATEADD(day, 1,GETUTCDATE()), NULL,                      22445,  NULL,  NULL);
GO

-- ── CHECKLISTS ────────────────────────────────────────────
-- VH-009: reprobado (extintor)
INSERT INTO checklists (vehiculo_id, chofer_id, fecha, turno, aprobado,
    luces_delanteras, luces_traseras, llantas, extintor, nivel_agua, nivel_aceite,
    bateria, limpiabrisas, bocina, espejos, cinturones, senales_emergencia, observaciones)
VALUES
(5, 5, DATEADD(minute,-15,GETUTCDATE()), 'dia', 0,
    1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 'Extintor vencido desde hace 2 días'),

-- VH-001: aprobado
(1, 1, DATEADD(hour,-3,GETUTCDATE()), 'dia', 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, NULL),

-- VH-003: aprobado
(2, 2, DATEADD(hour,-4,GETUTCDATE()), 'dia', 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, NULL);
GO

PRINT 'SOMILOR: Datos de prueba insertados correctamente.';
PRINT 'Usuario admin: admin@somilor.com / Admin123!';
GO
