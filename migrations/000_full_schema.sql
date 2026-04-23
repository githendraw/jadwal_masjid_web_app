-- ============================================================
-- Jadwal Masjid - Full Database Migration
-- Run: mysql -u <user> -p jadwal_masjid < migrations/000_full_schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS jadwal_masjid;
USE jadwal_masjid;

-- ============================================================
-- Table: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) DEFAULT '',
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'user') DEFAULT 'user',
  mosque_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  pairing_token VARCHAR(64) UNIQUE,
  pairing_token_expires_at DATETIME,
  last_login_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_mosque_id (mosque_id),
  INDEX idx_is_active (is_active)
);

-- ============================================================
-- Table: mosques
-- ============================================================
CREATE TABLE IF NOT EXISTS mosques (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mosque_uuid VARCHAR(128) UNIQUE,
  mosque_slug VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) DEFAULT '',
  settings JSON,
  lat DECIMAL(10, 7),
  `long` DECIMAL(10, 7),
  calculation_method ENUM('KEMENAG', 'JAKARTA_IST', 'ASRA', 'UM', 'MECCAH') DEFAULT 'KEMENAG',
  last_config_sync_at DATETIME,
  is_online BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (mosque_slug),
  INDEX idx_is_active (is_active)
);

-- Add address column if it doesn't exist (safe for existing DBs)
SET @dbname = DATABASE();
SET @tablename = 'mosques';
SET @columnname = 'address';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE mosques ADD COLUMN address VARCHAR(500) DEFAULT \'\' AFTER name'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================
-- Table: devices
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(128) PRIMARY KEY,
  mosque_id INT NOT NULL,
  name VARCHAR(255) DEFAULT 'Device',
  is_active BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE,
  INDEX idx_mosque_id (mosque_id),
  INDEX idx_is_online (is_online)
);

-- ============================================================
-- Table: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  payment_date DATE,
  expires_at DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- Table: pairing_codes
-- ============================================================
CREATE TABLE IF NOT EXISTS pairing_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(8) NOT NULL,
  mosque_id INT NOT NULL,
  device_uuid VARCHAR(128),
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  used_by_device VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE CASCADE,
  INDEX idx_code (code),
  INDEX idx_mosque_id (mosque_id),
  INDEX idx_expires_at (expires_at)
);

-- ============================================================
-- Seed data
-- ============================================================

-- Superadmin user (password: password)
INSERT INTO users (email, password_hash, role)
VALUES ('admin@jadwalmasjid.com', '$2b$10$1lbNoMbKtT/UxKl0v1uuPukEdsWX.QOaTZ5hZb0FuKYSMlFjP3LMK', 'superadmin')
ON DUPLICATE KEY UPDATE password_hash='$2b$10$1lbNoMbKtT/UxKl0v1uuPukEdsWX.QOaTZ5hZb0FuKYSMlFjP3LMK';

-- Sample mosque
INSERT INTO mosques (mosque_uuid, mosque_slug, name, address, lat, `long`, calculation_method, settings)
VALUES (
  UUID(),
  'masjid-al-ikhlas-bandung',
  'Masjid Al-Ikhlas Bandung',
  'Karanten Kulon III, Arcamanik, Kota Bandung',
  -6.9140000,
  107.6410000,
  'KEMENAG',
  '{"pengumumanJumat":"SALDO KAS MASJID HARI JUMAT - TERIMAKASIH","pengumumanKajian":"BARANGSIAPA YANG BERSHOLAWAT KEPADAKU SEKALI, MAKA ALLAH AKAN BERSHOLAWAT KEPADANYA SEPULUH KALI","location":"Karanten Kulon III, Arcamanik, Kota Bandung","prayer_times":[{"id":"subuh","name":"subuh","time":"04:30","status":"enabled"},{"id":"terbit","name":"terbit","time":"05:45","status":"enabled"},{"id":"dhuhur","name":"dhuhur","time":"11:45","status":"enabled"},{"id":"ashar","name":"ashar","time":"15:15","status":"enabled"},{"id":"maghrib","name":"maghrib","time":"17:45","status":"enabled"},{"id":"isya","name":"isya","time":"19:00","status":"enabled"}]}'
)
ON DUPLICATE KEY UPDATE name='Masjid Al-Ikhlas Bandung';

-- Update existing mosques that don't have pengumumanJumat/pengumumanKajian in settings
UPDATE mosques SET settings = JSON_SET(
  COALESCE(settings, '{}'),
  '$.pengumumanJumat', COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(settings, '$.pengumumanJumat')), ''), 'SALDO KAS MASJID HARI JUMAT - TERIMAKASIH'),
  '$.pengumumanKajian', COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(settings, '$.pengumumanKajian')), ''), 'BARANGSIAPA YANG BERSHOLAWAT KEPADAKU SEKALI, MAKA ALLAH AKAN BERSHOLAWAT KEPADANYA SEPULUH KALI'),
  '$.location', COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(settings, '$.location')), ''), address)
) WHERE settings IS NULL OR settings = '' OR NOT JSON_CONTAINS_PATH(settings, 'one', '$.pengumumanJumat');

-- Sync address column from settings.location or name+slug for existing mosques where address is empty
UPDATE mosques SET address = COALESCE(
  NULLIF(address, ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(settings, '$.location')), ''),
  CONCAT(name, ' - ', mosque_slug)
) WHERE address IS NULL OR address = '';