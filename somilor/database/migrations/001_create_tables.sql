-- ============================================================
-- SOMILOR Fleet Management System
-- Migration 001: Schema y tablas principales
-- Ejecutar en SQL Server como: sqlcmd -S server -d SOMILOR -i 001_create_tables.sql
-- ============================================================

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SOMILOR')
BEGIN
    CREATE DATABASE SOMILOR;
END
GO

USE SOMILOR;
GO

-- ── USUARIOS ──────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='usuarios' AND xtype='U')
CREATE TABLE usuarios (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    nombre            NVARCHAR(100)  NOT NULL,
    email             NVARCHAR(150)  NOT NULL UNIQUE,
    hashed_password   NVARCHAR(255)  NOT NULL,
    rol               NVARCHAR(50)   NOT NULL DEFAULT 'operador',
    activo            BIT            NOT NULL DEFAULT 1,
    creado_en         DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ── CHOFERES ──────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='choferes' AND xtype='U')
CREATE TABLE choferes (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    nombre              NVARCHAR(100) NOT NULL,
    apellido            NVARCHAR(100) NOT NULL,
    cedula              NVARCHAR(20)  NOT NULL UNIQUE,
    licencia            NVARCHAR(50),
    categoria_licencia  NVARCHAR(10),
    telefono            NVARCHAR(20),
    activo              BIT           NOT NULL DEFAULT 1,
    creado_en           DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ── VEHICULOS ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='vehiculos' AND xtype='U')
CREATE TABLE vehiculos (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    codigo              NVARCHAR(20)  NOT NULL UNIQUE,
    marca               NVARCHAR(80),
    modelo              NVARCHAR(80),
    anio                INT,
    placa               NVARCHAR(20)  UNIQUE,
    tipo                NVARCHAR(30)  NOT NULL,   -- camioneta|volqueta|excavadora|buldocer|otro
    estado              NVARCHAR(20)  NOT NULL DEFAULT 'libre', -- operativo|taller|libre
    kilometraje_actual  FLOAT         NOT NULL DEFAULT 0,
    horas_operacion     FLOAT         NOT NULL DEFAULT 0,
    nivel_combustible   FLOAT         NOT NULL DEFAULT 100,
    activo              BIT           NOT NULL DEFAULT 1,
    creado_en           DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    actualizado_en      DATETIME2
);
GO

-- ── ASIGNACIONES ──────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='asignaciones' AND xtype='U')
CREATE TABLE asignaciones (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    vehiculo_id     INT          NOT NULL REFERENCES vehiculos(id),
    chofer_id       INT          NOT NULL REFERENCES choferes(id),
    fecha_inicio    DATETIME2    NOT NULL DEFAULT GETUTCDATE(),
    fecha_fin       DATETIME2,
    activa          BIT          NOT NULL DEFAULT 1,
    observaciones   NVARCHAR(MAX)
);
GO

-- ── TANQUEOS ──────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tanqueos' AND xtype='U')
CREATE TABLE tanqueos (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    vehiculo_id         INT       NOT NULL REFERENCES vehiculos(id),
    chofer_id           INT                REFERENCES choferes(id),
    fecha               DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    litros              FLOAT     NOT NULL,
    km_inicial          FLOAT,
    km_final            FLOAT,
    horas_inicial       FLOAT,
    horas_final         FLOAT,
    rendimiento_km_l    FLOAT,
    costo_total         FLOAT,
    precio_litro        FLOAT,
    es_anomalia         BIT       NOT NULL DEFAULT 0,
    observaciones       NVARCHAR(MAX)
);
GO

-- ── MANTENIMIENTOS ────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='mantenimientos' AND xtype='U')
CREATE TABLE mantenimientos (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    vehiculo_id         INT           NOT NULL REFERENCES vehiculos(id),
    tipo                NVARCHAR(20)  NOT NULL, -- preventivo|correctivo
    estado              NVARCHAR(20)  NOT NULL DEFAULT 'programado',
    descripcion         NVARCHAR(255) NOT NULL,
    fecha_programada    DATETIME2,
    fecha_realizado     DATETIME2,
    km_programado       FLOAT,
    km_realizado        FLOAT,
    horas_programado    FLOAT,
    costo               FLOAT,
    taller              NVARCHAR(150),
    observaciones       NVARCHAR(MAX),
    creado_en           DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ── CHECKLISTS ────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='checklists' AND xtype='U')
CREATE TABLE checklists (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    vehiculo_id         INT          NOT NULL REFERENCES vehiculos(id),
    chofer_id           INT          NOT NULL REFERENCES choferes(id),
    fecha               DATETIME2    NOT NULL DEFAULT GETUTCDATE(),
    turno               NVARCHAR(10) NOT NULL DEFAULT 'dia',
    aprobado            BIT,
    luces_delanteras    BIT,
    luces_traseras      BIT,
    llantas             BIT,
    extintor            BIT,
    nivel_agua          BIT,
    nivel_aceite        BIT,
    bateria             BIT,
    limpiabrisas        BIT,
    bocina              BIT,
    espejos             BIT,
    cinturones          BIT,
    senales_emergencia  BIT,
    observaciones       NVARCHAR(MAX)
);
GO

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_tanqueos_vehiculo_fecha ON tanqueos(vehiculo_id, fecha);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_estado ON mantenimientos(estado, fecha_programada);
CREATE INDEX IF NOT EXISTS idx_checklists_fecha ON checklists(fecha, aprobado);
GO

PRINT 'SOMILOR: Tablas creadas exitosamente.';
GO
