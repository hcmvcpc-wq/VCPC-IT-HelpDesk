
import { Ticket, Asset, User, SystemLog } from '../types';

/**
 * Tạo Script khởi tạo bảng (DDL) cho SQL Server
 */
export const generateSQLSchema = (): string => {
  return `
-- SQL SERVER MIGRATION SCRIPT
-- Generated at: ${new Date().toLocaleString()}

-- 1. Table Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
CREATE TABLE Users (
    UserID NVARCHAR(50) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(200),
    Role NVARCHAR(20),
    Department NVARCHAR(100),
    Subsidiary NVARCHAR(50)
);

-- 2. Table Assets
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Assets')
CREATE TABLE Assets (
    AssetID NVARCHAR(50) PRIMARY KEY,
    AssetName NVARCHAR(255) NOT NULL,
    AssetType NVARCHAR(100),
    SerialNumber NVARCHAR(100),
    Status NVARCHAR(50),
    AssignedToID NVARCHAR(50),
    AssignedToName NVARCHAR(200),
    Subsidiary NVARCHAR(50),
    Department NVARCHAR(100),
    PurchaseDate DATE,
    AssetValue MONEY
);

-- 3. Table Tickets
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tickets')
CREATE TABLE Tickets (
    TicketID NVARCHAR(50) PRIMARY KEY,
    Title NVARCHAR(500) NOT NULL,
    Description NVARCHAR(MAX),
    Status NVARCHAR(50),
    Priority NVARCHAR(50),
    Category NVARCHAR(100),
    CreatorID NVARCHAR(50),
    CreatorName NVARCHAR(200),
    Department NVARCHAR(100),
    Subsidiary NVARCHAR(50),
    CreatedAt DATETIME2,
    UpdatedAt DATETIME2,
    Location NVARCHAR(200)
);

-- 4. Table SystemLogs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemLogs')
CREATE TABLE SystemLogs (
    LogID NVARCHAR(50) PRIMARY KEY,
    Timestamp DATETIME2,
    UserID NVARCHAR(50),
    UserName NVARCHAR(200),
    Action NVARCHAR(100),
    Details NVARCHAR(MAX),
    LogType NVARCHAR(20)
);
`;
};

/**
 * Chuyển đổi dữ liệu hiện tại thành lệnh INSERT
 */
export const generateSQLDataMigration = (data: {
  users: User[],
  assets: Asset[],
  tickets: Ticket[],
  logs: SystemLog[]
}): string => {
  let sql = `-- DATA MIGRATION SCRIPT\n-- Records count: ${data.users.length + data.assets.length + data.tickets.length + data.logs.length}\n\n`;

  // Migrating Users
  sql += "/* MIGRATING USERS */\n";
  data.users.forEach(u => {
    sql += `INSERT INTO Users (UserID, Username, Password, FullName, Role, Department, Subsidiary) VALUES (N'${u.id}', N'${u.username}', N'${u.password || '123'}', N'${u.fullName}', N'${u.role}', N'${u.department}', N'${u.subsidiary}');\n`;
  });

  // Migrating Assets
  sql += "\n/* MIGRATING ASSETS */\n";
  data.assets.forEach(a => {
    sql += `INSERT INTO Assets (AssetID, AssetName, AssetType, SerialNumber, Status, AssignedToID, AssignedToName, Subsidiary, Department, PurchaseDate, AssetValue) VALUES (N'${a.id}', N'${a.name}', N'${a.type}', N'${a.serialNumber}', N'${a.status}', N'${a.assignedToId || ''}', N'${a.assignedToName || ''}', N'${a.subsidiary}', N'${a.department}', '${a.purchaseDate}', ${a.value});\n`;
  });

  // Migrating Tickets
  sql += "\n/* MIGRATING TICKETS */\n";
  data.tickets.forEach(t => {
    sql += `INSERT INTO Tickets (TicketID, Title, Description, Status, Priority, Category, CreatorID, CreatorName, Department, Subsidiary, CreatedAt, UpdatedAt, Location) VALUES (N'${t.id}', N'${t.title.replace(/'/g, "''")}', N'${t.description.replace(/'/g, "''")}', N'${t.status}', N'${t.priority}', N'${t.category}', N'${t.creatorId}', N'${t.creatorName}', N'${t.department}', N'${t.subsidiary}', '${t.createdAt}', '${t.updatedAt}', N'${t.location || ''}');\n`;
  });

  return sql;
};

/**
 * Tải file SQL về máy
 */
export const downloadSQLFile = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
