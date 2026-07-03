-- Ensure WorkAssignments table exists
CREATE TABLE IF NOT EXISTS WorkAssignments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    worker_id INT NOT NULL,
    stage VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP NULL,
    CONSTRAINT FK_WorkAssignments_order FOREIGN KEY (order_id) REFERENCES Orders(id),
    CONSTRAINT FK_WorkAssignments_worker FOREIGN KEY (worker_id) REFERENCES Workers(id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS IX_WorkAssignments_order_id ON WorkAssignments(order_id);
CREATE INDEX IF NOT EXISTS IX_WorkAssignments_stage ON WorkAssignments(stage);
CREATE INDEX IF NOT EXISTS IX_WorkAssignments_worker_id ON WorkAssignments(worker_id);
