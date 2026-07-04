-- PostgreSQL version of transaction_tables.sql

CREATE TABLE Orders (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    advance NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    current_stage VARCHAR(20) NOT NULL DEFAULT 'Booked',
    status VARCHAR(20) NOT NULL DEFAULT 'Open',
    notes VARCHAR(1000) NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE OrderItems (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    garment_type VARCHAR(100) NOT NULL,
    qty INT NOT NULL,
    rate NUMERIC(12,2) NOT NULL,
    amount NUMERIC(12,2) GENERATED ALWAYS AS (qty * rate) STORED,
    fabric_id INT NULL,
    remarks VARCHAR(500) NULL,
    stage_booked BOOLEAN NOT NULL DEFAULT true,
    stage_booked_at TIMESTAMP NULL,
    stage_cutting BOOLEAN NOT NULL DEFAULT false,
    stage_cutting_at TIMESTAMP NULL,
    stage_stitching BOOLEAN NOT NULL DEFAULT false,
    stage_stitching_at TIMESTAMP NULL,
    stage_trial BOOLEAN NOT NULL DEFAULT false,
    stage_trial_at TIMESTAMP NULL,
    stage_alteration BOOLEAN NOT NULL DEFAULT false,
    stage_alteration_at TIMESTAMP NULL,
    stage_pressing BOOLEAN NOT NULL DEFAULT false,
    stage_pressing_at TIMESTAMP NULL,
    stage_ready BOOLEAN NOT NULL DEFAULT false,
    stage_ready_at TIMESTAMP NULL,
    stage_delivered BOOLEAN NOT NULL DEFAULT false,
    stage_delivered_at TIMESTAMP NULL
);

CREATE TABLE Measurements (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    neck NUMERIC(6,2) NULL,
    chest NUMERIC(6,2) NULL,
    waist NUMERIC(6,2) NULL,
    hip NUMERIC(6,2) NULL,
    shoulder NUMERIC(6,2) NULL,
    sleeve NUMERIC(6,2) NULL,
    length NUMERIC(6,2) NULL,
    collar NUMERIC(6,2) NULL,
    shalwar_len NUMERIC(6,2) NULL,
    pancha NUMERIC(6,2) NULL
);

CREATE TABLE Payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(20) NOT NULL,
    reference VARCHAR(120) NULL,
    notes VARCHAR(500) NULL,
    recorded_by INT NOT NULL
);

CREATE TABLE CustomerPayments (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(20) NOT NULL,
    notes VARCHAR(500) NULL,
    recorded_by INT NOT NULL,
    applied_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT FK_CustomerPayments_Customers FOREIGN KEY (customer_id) REFERENCES Customers(id),
    CONSTRAINT FK_CustomerPayments_Users FOREIGN KEY (recorded_by) REFERENCES Users(id)
);

CREATE TABLE Expenses (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(160) NULL,
    description VARCHAR(250) NOT NULL,
    cost NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    category VARCHAR(80) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by INT NOT NULL
);

CREATE TABLE WorkAssignments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    worker_id INT NOT NULL,
    stage VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP NULL
);

CREATE TABLE WorkerEarnings (
    id SERIAL PRIMARY KEY,
    worker_id INT NOT NULL,
    order_id INT NOT NULL,
    stage VARCHAR(20) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT FK_WorkerEarnings_Workers FOREIGN KEY (worker_id) REFERENCES Workers(id),
    CONSTRAINT FK_WorkerEarnings_Orders FOREIGN KEY (order_id) REFERENCES Orders(id)
);

CREATE TABLE WorkerPayments (
    id SERIAL PRIMARY KEY,
    worker_id INT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes VARCHAR(500) NULL,
    recorded_by INT NOT NULL,
    CONSTRAINT FK_WorkerPayments_Workers FOREIGN KEY (worker_id) REFERENCES Workers(id),
    CONSTRAINT FK_WorkerPayments_Users FOREIGN KEY (recorded_by) REFERENCES Users(id)
);
