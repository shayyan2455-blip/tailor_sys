USE TailorERP;
GO

CREATE TABLE dbo.Workers (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Workers PRIMARY KEY,
    name NVARCHAR(120) NOT NULL,
    mobile NVARCHAR(30) NULL,
    wage_rate DECIMAL(12,2) NOT NULL CONSTRAINT DF_Workers_wage_rate DEFAULT (0),
    default_stage NVARCHAR(20) NULL,
    is_active BIT NOT NULL CONSTRAINT DF_Workers_is_active DEFAULT (1),
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Workers_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Workers_default_stage CHECK (default_stage IS NULL OR default_stage IN (N'Booked', N'Cutting', N'Stitching', N'Ready', N'Delivered'))
);
GO

CREATE TABLE dbo.Users (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
    username NVARCHAR(80) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL,
    worker_id INT NULL,
    is_active BIT NOT NULL CONSTRAINT DF_Users_is_active DEFAULT (1),
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Users_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_Users_username UNIQUE (username),
    CONSTRAINT CK_Users_role CHECK (role IN (N'Admin', N'Manager', N'Worker'))
);
GO

CREATE TABLE dbo.Customers (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Customers PRIMARY KEY,
    name NVARCHAR(160) NOT NULL,
    mobile NVARCHAR(30) NOT NULL,
    address NVARCHAR(500) NULL,
    credit_balance DECIMAL(12,2) NOT NULL CONSTRAINT DF_Customers_credit_balance DEFAULT (0),
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Customers_created_at DEFAULT (SYSUTCDATETIME())
);
GO

CREATE TABLE dbo.Designs (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Designs PRIMARY KEY,
    name NVARCHAR(120) NOT NULL,
    description NVARCHAR(500) NULL,
    default_rate DECIMAL(12,2) NOT NULL CONSTRAINT DF_Designs_default_rate DEFAULT (0),
    is_active BIT NOT NULL CONSTRAINT DF_Designs_is_active DEFAULT (1)
);
GO

CREATE TABLE dbo.Fabrics (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Fabrics PRIMARY KEY,
    name NVARCHAR(120) NOT NULL,
    cost_per_unit DECIMAL(12,2) NOT NULL CONSTRAINT DF_Fabrics_cost_per_unit DEFAULT (0),
    supplier NVARCHAR(160) NULL,
    is_active BIT NOT NULL CONSTRAINT DF_Fabrics_is_active DEFAULT (1)
);
GO

CREATE TABLE dbo.CustomerMeasurements (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CustomerMeasurements PRIMARY KEY,
    customer_id INT NOT NULL,
    neck DECIMAL(6,2) NULL,
    chest DECIMAL(6,2) NULL,
    waist DECIMAL(6,2) NULL,
    hip DECIMAL(6,2) NULL,
    shoulder DECIMAL(6,2) NULL,
    sleeve DECIMAL(6,2) NULL,
    length DECIMAL(6,2) NULL,
    collar DECIMAL(6,2) NULL,
    shalwar_len DECIMAL(6,2) NULL,
    pancha DECIMAL(6,2) NULL,
    updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_CustomerMeasurements_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_CustomerMeasurements_customer UNIQUE (customer_id),
    CONSTRAINT FK_CustomerMeasurements_customer FOREIGN KEY (customer_id) REFERENCES dbo.Customers(id) ON DELETE CASCADE
);
GO
