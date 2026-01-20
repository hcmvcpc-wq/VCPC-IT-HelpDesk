
import { Ticket, Asset, User, SystemLog } from '../types';

export const generateSQLSchema = (): string => {
  return `
-- HELP DESK PRO: MYSQL DATABASE SCHEMA
-- Generated: ${new Date().toISOString()}

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for Users
-- ----------------------------
CREATE TABLE IF NOT EXISTS \`Users\` (
  \`id\` varchar(50) NOT NULL,
  \`username\` varchar(100) NOT NULL,
  \`password\` varchar(255) DEFAULT '123',
  \`fullName\` varchar(255) NOT NULL,
  \`role\` enum('ADMIN','USER') DEFAULT 'USER',
  \`department\` varchar(100) DEFAULT NULL,
  \`subsidiary\` varchar(50) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_username\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for Assets
-- ----------------------------
CREATE TABLE IF NOT EXISTS \`Assets\` (
  \`id\` varchar(50) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`type\` varchar(100) DEFAULT NULL,
  \`serialNumber\` varchar(100) DEFAULT NULL,
  \`status\` varchar(50) DEFAULT NULL,
  \`assignedToId\` varchar(50) DEFAULT NULL,
  \`assignedToName\` varchar(255) DEFAULT NULL,
  \`subsidiary\` varchar(50) DEFAULT NULL,
  \`department\` varchar(100) DEFAULT NULL,
  \`purchaseDate\` date DEFAULT NULL,
  \`value\` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for Tickets
-- ----------------------------
CREATE TABLE IF NOT EXISTS \`Tickets\` (
  \`id\` varchar(50) NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`description\` text,
  \`status\` varchar(50) NOT NULL,
  \`priority\` varchar(50) NOT NULL,
  \`category\` varchar(100) DEFAULT NULL,
  \`creatorId\` varchar(50) NOT NULL,
  \`creatorName\` varchar(255) DEFAULT NULL,
  \`department\` varchar(100) DEFAULT NULL,
  \`subsidiary\` varchar(50) DEFAULT NULL,
  \`location\` varchar(255) DEFAULT NULL,
  \`createdAt\` datetime DEFAULT NULL,
  \`updatedAt\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
`;
};

export const generateSQLDataMigration = (data: {
  users: User[],
  assets: Asset[],
  tickets: Ticket[],
  logs: SystemLog[]
}): string => {
  let sql = `\n-- INITIAL DATA MIGRATION\n\n`;

  if (data.users.length > 0) {
    sql += "REPLACE INTO `Users` (`id`, `username`, `password`, `fullName`, `role`, `department`, `subsidiary`) VALUES\n";
    sql += data.users.map(u => `('${u.id}', '${u.username}', '${u.password || '123'}', '${u.fullName}', '${u.role}', '${u.department}', '${u.subsidiary}')`).join(",\n") + ";\n\n";
  }

  if (data.assets.length > 0) {
    sql += "REPLACE INTO `Assets` (`id`, \`name\`, \`type\`, \`serialNumber\`, \`status\`, \`assignedToId\`, \`assignedToName\`, \`subsidiary\`, \`department\`, \`purchaseDate\`, \`value\`) VALUES\n";
    sql += data.assets.map(a => `('${a.id}', '${a.name.replace(/'/g, "''")}', '${a.type}', '${a.serialNumber}', '${a.status}', '${a.assignedToId || ''}', '${a.assignedToName || ''}', '${a.subsidiary}', '${a.department}', '${a.purchaseDate}', ${a.value})`).join(",\n") + ";\n\n";
  }

  return sql;
};
