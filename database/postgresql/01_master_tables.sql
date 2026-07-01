-- PostgreSQL version of master_tables.sql

CREATE TABLE Workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    mobile VARCHAR(30) NULL,
    wage_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    default_stage VARCHAR(20) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT CK_Workers_default_stage CHECK (default_stage IS NULL OR default_stage IN ('Booked', 'Cutting', 'Stitching', 'Trial', 'Alteration', 'Pressing', 'Ready', 'Delivered'))
);

CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    worker_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT UQ_Users_username UNIQUE (username),
    CONSTRAINT CK_Users_role CHECK (role IN ('Admin', 'Manager', 'Worker'))
);

CREATE TABLE Customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    address VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE Designs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500) NULL,
    default_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE Fabrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0,
    supplier VARCHAR(160) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE CustomerMeasurements (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    neck NUMERIC(6,2) NULL,
    chest NUMERIC(6,2) NULL,
    waist NUMERIC(6,2) NULL,
    hip NUMERIC(6,2) NULL,
    shoulder NUMERIC(6,2) NULL,
    sleeve NUMERIC(6,2) NULL,
    length NUMERIC(6,2) NULL,
    collar NUMERIC(6,2) NULL,
    shalwar_len NUMERIC(6,2) NULL,
    pancha NUMERIC(6,2) NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT UQ_CustomerMeasurements_customer UNIQUE (customer_id),
    CONSTRAINT FK_CustomerMeasurements_customer FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE
);
