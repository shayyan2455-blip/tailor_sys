-- Ensure Users table exists
CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    worker_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT UQ_Users_username UNIQUE (username),
    CONSTRAINT CK_Users_role CHECK (role IN ('Admin', 'Manager', 'Worker')),
    CONSTRAINT FK_Users_worker FOREIGN KEY (worker_id) REFERENCES Workers(id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_Users_username ON Users(username);
CREATE INDEX IF NOT EXISTS IX_Users_role ON Users(role);
CREATE INDEX IF NOT EXISTS IX_Users_is_active ON Users(is_active);
CREATE INDEX IF NOT EXISTS IX_Users_worker_id ON Users(worker_id);
