-- PostgreSQL version of seed_data.sql

INSERT INTO Users(username, password_hash, role, worker_id, is_active)
SELECT 'admin', '$2b$10$ZXFdeMzdspkvKHl1CHI7qOxyk3vIP2kVfBlmqc.o6/HDvPmSfbMKq', 'Admin', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE username = 'admin');

INSERT INTO Designs(name, description, default_rate, is_active)
SELECT 'Shalwar Kameez', 'Standard two-piece stitching', 2500, true
WHERE NOT EXISTS (SELECT 1 FROM Designs);

INSERT INTO Designs(name, description, default_rate, is_active)
SELECT 'Waistcoat', 'Formal waistcoat stitching', 3500, true
WHERE NOT EXISTS (SELECT 1 FROM Designs WHERE name = 'Waistcoat');

INSERT INTO Designs(name, description, default_rate, is_active)
SELECT 'Kurta', 'Basic kurta stitching', 1800, true
WHERE NOT EXISTS (SELECT 1 FROM Designs WHERE name = 'Kurta');

INSERT INTO Fabrics(name, cost_per_unit, supplier, is_active)
SELECT 'Cotton', 850, 'Local Supplier', true
WHERE NOT EXISTS (SELECT 1 FROM Fabrics);

INSERT INTO Fabrics(name, cost_per_unit, supplier, is_active)
SELECT 'Linen', 1200, 'Premium Textiles', true
WHERE NOT EXISTS (SELECT 1 FROM Fabrics WHERE name = 'Linen');

INSERT INTO Fabrics(name, cost_per_unit, supplier, is_active)
SELECT 'Wash & Wear', 950, 'City Fabric Market', true
WHERE NOT EXISTS (SELECT 1 FROM Fabrics WHERE name = 'Wash & Wear');
