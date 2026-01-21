
import { Ticket, Asset, User, SystemLog } from '../types';

/**
 * Tạo Script khởi tạo toàn bộ Database cho MySQL
 */
export const generateSQLSchema = (): string => {
  return `-- IT HELPDESK VCPC - MYSQL DATABASE INITIALIZATION
-- Create Database
CREATE DATABASE IF NOT EXISTS helpdesk_vcpc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE helpdesk_vcpc;

-- 1. Table Users
CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT '123',
    fullName VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'USER') DEFAULT 'USER',
    department VARCHAR(100),
    subsidiary VARCHAR(50)
) ENGINE=InnoDB;

-- 2. Table Assets
CREATE TABLE IF NOT EXISTS Assets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    serialNumber VARCHAR(100),
    status VARCHAR(50),
    assignedToId VARCHAR(50),
    assignedToName VARCHAR(255),
    subsidiary VARCHAR(50),
    department VARCHAR(100),
    purchaseDate DATE,
    value DECIMAL(15, 2) DEFAULT 0,
    FOREIGN KEY (assignedToId) REFERENCES Users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Table Tickets
CREATE TABLE IF NOT EXISTS Tickets (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    creatorId VARCHAR(50),
    creatorName VARCHAR(255),
    department VARCHAR(100),
    subsidiary VARCHAR(50),
    location VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creatorId) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Table Comments (Lưu lịch sử trao đổi trong Ticket)
CREATE TABLE IF NOT EXISTS Comments (
    id VARCHAR(50) PRIMARY KEY,
    ticketId VARCHAR(50),
    senderId VARCHAR(50),
    senderName VARCHAR(255),
    senderRole VARCHAR(20),
    message TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    isSystem BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ticketId) REFERENCES Tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Table SystemLogs
CREATE TABLE IF NOT EXISTS SystemLogs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    userId VARCHAR(50),
    userName VARCHAR(255),
    action VARCHAR(100),
    details TEXT,
    type VARCHAR(20)
) ENGINE=InnoDB;

-- Insert Default Admin
REPLACE INTO Users (id, username, password, fullName, role, department, subsidiary) 
VALUES ('u1', 'admin', '123', 'Quản Trị Viên', 'ADMIN', 'IT', 'VCPC');
`;
};

/**
 * Chuyển đổi dữ liệu từ LocalStorage sang SQL để di cư (Migration)
 */
export const generateSQLDataMigration = (data: {
  users: User[],
  assets: Asset[],
  tickets: Ticket[],
  logs: SystemLog[]
}): string => {
  let sql = `-- MIGRATION DATA\n`;
  
  if (data.users.length > 0) {
    sql += "\n-- Users\nREPLACE INTO Users (id, username, password, fullName, role, department, subsidiary) VALUES\n";
    sql += data.users.map(u => `('${u.id}', '${u.username}', '${u.password || '123'}', '${u.fullName}', '${u.role}', '${u.department}', '${u.subsidiary}')`).join(",\n") + ";\n";
  }

  if (data.assets.length > 0) {
    sql += "\n-- Assets\nREPLACE INTO Assets (id, name, type, serialNumber, status, assignedToId, assignedToName, subsidiary, department, purchaseDate, value) VALUES\n";
    sql += data.assets.map(a => `('${a.id}', '${a.name.replace(/'/g, "''")}', '${a.type}', '${a.serialNumber}', '${a.status}', ${a.assignedToId ? `'${a.assignedToId}'` : 'NULL'}, '${a.assignedToName || ''}', '${a.subsidiary}', '${a.department}', '${a.purchaseDate}', ${a.value})`).join(",\n") + ";\n";
  }

  return sql;
};
