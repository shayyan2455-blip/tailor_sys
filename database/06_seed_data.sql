USE TailorERP;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE username = N'admin')
BEGIN
    INSERT INTO dbo.Users(username, password_hash, role, worker_id, is_active)
    VALUES (
        N'admin',
        N'$2b$10$7EqJtq98hPqEX7fNZaFWoOqWm4HLNlmXNy1QnZ.7bN2Vdu3Q0dJQG',
        N'Admin',
        NULL,
        1
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Designs)
BEGIN
    INSERT INTO dbo.Designs(name, description, default_rate, is_active)
    VALUES
        (N'Shalwar Kameez', N'Standard two-piece stitching', 2500, 1),
        (N'Waistcoat', N'Formal waistcoat stitching', 3500, 1),
        (N'Kurta', N'Basic kurta stitching', 1800, 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Fabrics)
BEGIN
    INSERT INTO dbo.Fabrics(name, cost_per_unit, supplier, is_active)
    VALUES
        (N'Cotton', 850, N'Local Supplier', 1),
        (N'Linen', 1200, N'Premium Textiles', 1),
        (N'Wash & Wear', 950, N'City Fabric Market', 1);
END;
GO
