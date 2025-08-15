-- Tabel antrian
CREATE TABLE queues (
    id SERIAL PRIMARY KEY,
    queue_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Menunggu',
    teller_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Tabel teller
CREATE TABLE tellers (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL
);

-- Tabel admin
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Tabel display content
CREATE TABLE display_contents (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(20) NOT NULL, -- 'video', 'currency', 'info'
    content_value TEXT,
    display_order INTEGER,
    duration INTEGER, -- untuk video
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabel currency rates
CREATE TABLE currency_rates (
    id SERIAL PRIMARY KEY,
    currency_code VARCHAR(3) NOT NULL,
    buy_rate DECIMAL(10,2) NOT NULL,
    sell_rate DECIMAL(10,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default teller
INSERT INTO tellers (ip_address, name) VALUES
('192.168.1.101', 'Teller 1'),
('192.168.1.102', 'Teller 2'),
('192.168.1.103', 'Teller 3');

-- Insert default admin
INSERT INTO admins (username, password) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrUv.3B7.7F/pQ7I4UzqBNt1Q4WzqK6'); -- password: admin123