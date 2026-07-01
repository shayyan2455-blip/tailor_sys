USE TailorERP;
GO

CREATE TABLE dbo.Orders (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Orders PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL CONSTRAINT DF_Orders_order_date DEFAULT (CONVERT(date, SYSUTCDATETIME())),
    delivery_date DATE NULL,
    total_amount DECIMAL(12,2) NOT NULL CONSTRAINT DF_Orders_total_amount DEFAULT (0),
    advance DECIMAL(12,2) NOT NULL CONSTRAINT DF_Orders_advance DEFAULT (0),
    balance DECIMAL(12,2) NOT NULL CONSTRAINT DF_Orders_balance DEFAULT (0),
    current_stage NVARCHAR(20) NOT NULL CONSTRAINT DF_Orders_current_stage DEFAULT (N'Booked'),
    status NVARCHAR(20) NOT NULL CONSTRAINT DF_Orders_status DEFAULT (N'Open'),
    notes NVARCHAR(1000) NULL,
    created_by INT NOT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Orders_created_at DEFAULT (SYSUTCDATETIME())
);
GO

CREATE TABLE dbo.OrderItems (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_OrderItems PRIMARY KEY,
    order_id INT NOT NULL,
    garment_type NVARCHAR(100) NOT NULL,
    qty INT NOT NULL,
    rate DECIMAL(12,2) NOT NULL,
    amount AS (CONVERT(DECIMAL(12,2), qty * rate)) PERSISTED,
    fabric_id INT NULL,
    remarks NVARCHAR(500) NULL,
    stage_booked BIT NOT NULL CONSTRAINT DF_OrderItems_stage_booked DEFAULT (1),
    stage_booked_at DATETIME2(0) NULL,
    stage_cutting BIT NOT NULL CONSTRAINT DF_OrderItems_stage_cutting DEFAULT (0),
    stage_cutting_at DATETIME2(0) NULL,
    stage_stitching BIT NOT NULL CONSTRAINT DF_OrderItems_stage_stitching DEFAULT (0),
    stage_stitching_at DATETIME2(0) NULL,
    stage_trial BIT NOT NULL CONSTRAINT DF_OrderItems_stage_trial DEFAULT (0),
    stage_trial_at DATETIME2(0) NULL,
    stage_alteration BIT NOT NULL CONSTRAINT DF_OrderItems_stage_alteration DEFAULT (0),
    stage_alteration_at DATETIME2(0) NULL,
    stage_pressing BIT NOT NULL CONSTRAINT DF_OrderItems_stage_pressing DEFAULT (0),
    stage_pressing_at DATETIME2(0) NULL,
    stage_ready BIT NOT NULL CONSTRAINT DF_OrderItems_stage_ready DEFAULT (0),
    stage_ready_at DATETIME2(0) NULL,
    stage_delivered BIT NOT NULL CONSTRAINT DF_OrderItems_stage_delivered DEFAULT (0),
    stage_delivered_at DATETIME2(0) NULL
);
GO

CREATE TABLE dbo.Measurements (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Measurements PRIMARY KEY,
    order_id INT NOT NULL,
    neck DECIMAL(6,2) NULL,
    chest DECIMAL(6,2) NULL,
    waist DECIMAL(6,2) NULL,
    hip DECIMAL(6,2) NULL,
    shoulder DECIMAL(6,2) NULL,
    sleeve DECIMAL(6,2) NULL,
    length DECIMAL(6,2) NULL,
    collar DECIMAL(6,2) NULL,
    shalwar_len DECIMAL(6,2) NULL,
    pancha DECIMAL(6,2) NULL
);
GO

CREATE TABLE dbo.Payments (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Payments PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL CONSTRAINT DF_Payments_payment_date DEFAULT (CONVERT(date, SYSUTCDATETIME())),
    payment_type NVARCHAR(20) NOT NULL,
    reference NVARCHAR(120) NULL,
    notes NVARCHAR(500) NULL,
    recorded_by INT NOT NULL
);
GO

CREATE TABLE dbo.Expenses (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Expenses PRIMARY KEY,
    supplier_name NVARCHAR(160) NULL,
    description NVARCHAR(250) NOT NULL,
    cost DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) NOT NULL CONSTRAINT DF_Expenses_paid_amount DEFAULT (0),
    balance DECIMAL(12,2) NOT NULL CONSTRAINT DF_Expenses_balance DEFAULT (0),
    category NVARCHAR(80) NOT NULL,
    expense_date DATE NOT NULL CONSTRAINT DF_Expenses_expense_date DEFAULT (CONVERT(date, SYSUTCDATETIME())),
    recorded_by INT NOT NULL
);
GO

CREATE TABLE dbo.WorkAssignments (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WorkAssignments PRIMARY KEY,
    order_id INT NOT NULL,
    worker_id INT NOT NULL,
    stage NVARCHAR(20) NOT NULL,
    assigned_at DATETIME2(0) NOT NULL CONSTRAINT DF_WorkAssignments_assigned_at DEFAULT (SYSUTCDATETIME()),
    completed_at DATETIME2(0) NULL
);
GO

CREATE TABLE dbo.WorkerEarnings (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WorkerEarnings PRIMARY KEY,
    worker_id INT NOT NULL,
    order_id INT NOT NULL,
    stage NVARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    earned_at DATETIME2(0) NOT NULL CONSTRAINT DF_WorkerEarnings_earned_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_WorkerEarnings_Workers FOREIGN KEY (worker_id) REFERENCES dbo.Workers(id),
    CONSTRAINT FK_WorkerEarnings_Orders FOREIGN KEY (order_id) REFERENCES dbo.Orders(id)
);
GO

CREATE TABLE dbo.WorkerPayments (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WorkerPayments PRIMARY KEY,
    worker_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL CONSTRAINT DF_WorkerPayments_payment_date DEFAULT (CONVERT(date, SYSUTCDATETIME())),
    notes NVARCHAR(500) NULL,
    recorded_by INT NOT NULL,
    CONSTRAINT FK_WorkerPayments_Workers FOREIGN KEY (worker_id) REFERENCES dbo.Workers(id),
    CONSTRAINT FK_WorkerPayments_Users FOREIGN KEY (recorded_by) REFERENCES dbo.Users(id)
);
GO
