-- Migration: 001_initial_schema.sql

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    total_capacity INT NOT NULL CHECK (total_capacity > 0),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ACTIVE', 'SOLD_OUT', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: users (Representación simplificada para el contexto)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: tickets
-- Cada asiento o boleto es una fila única para permitir bloqueos independientes.
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'SOLD')),
    reserved_until TIMESTAMP WITH TIME ZONE,
    version INT DEFAULT 1, -- Para Optimistic Locking híbrido si es necesario
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Un usuario no puede comprar el mismo boleto dos veces (sanity check)
    CONSTRAINT uq_ticket_user UNIQUE (id, user_id)
);

-- Índices estratégicos para optimización de consultas concurrentes
-- Índice compuesto para buscar boletos disponibles de un evento rápidamente
CREATE INDEX idx_tickets_event_status ON tickets(event_id, status) WHERE status = 'AVAILABLE';
-- Índice para expirar reservas
CREATE INDEX idx_tickets_reserved_until ON tickets(reserved_until) WHERE status = 'RESERVED';