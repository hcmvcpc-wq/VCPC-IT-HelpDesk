export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AssetStatus {
  IN_USE = 'IN_USE',
  IN_STOCK = 'IN_STOCK',
  REPAIRING = 'REPAIRING',
  BROKEN = 'BROKEN',
  RETIRED = 'RETIRED'
}

export interface Attachment {
  id: string;
  name: string;
  type: string; // mimeType
  data: string; // base64
}

export interface Comment {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole | 'SYSTEM';
  message: string;
  createdAt: string;
  isSystem?: boolean;
  attachments?: Attachment[];
}

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  department: string;
  subsidiary: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  status: AssetStatus;
  assignedToId?: string;
  assignedToName?: string;
  purchaseDate: string;
  value: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  creatorId: string;
  creatorName: string;
  department: string; 
  subsidiary: string; 
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  location: string;
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';
}

export interface DashboardStats {
  total: number;
  open: number;
  resolved: number;
  critical: number;
}