import { Ticket, TicketStatus, TicketPriority, User, UserRole, Asset, AssetStatus } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', password: '123', fullName: 'Quản Trị Viên', role: UserRole.ADMIN, department: 'IT', subsidiary: 'VCHC' },
  { id: 'u2', username: 'john', password: '123', fullName: 'John Doe', role: UserRole.USER, department: 'Marketing', subsidiary: 'VCHQ' },
  { id: 'u3', username: 'jane', password: '123', fullName: 'Jane Smith', role: UserRole.USER, department: 'Warehouse', subsidiary: 'VCHD' },
];

export const SUBSIDIARIES = ['VCHC', 'VCHQ', 'VCHD', 'VCLT'];
export const DEPARTMENTS = ['Marketing', 'IT', 'HR', 'Sales', 'Production', 'Warehouse', 'Artwork', 'Planning'];
export const CATEGORIES = ['Hardware', 'Software', 'Network', 'Security', 'Setup', 'Account'];
export const ASSET_TYPES = ['Laptop', 'Desktop', 'Monitor', 'Server', 'Printer', 'Mobile', 'Network Device'];

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'AST-001',
    name: 'MacBook Pro 14" M3',
    type: 'Laptop',
    serialNumber: 'MBP14M3-X992',
    status: AssetStatus.IN_USE,
    assignedToId: 'u2',
    assignedToName: 'John Doe',
    purchaseDate: '2024-01-15',
    value: 45000000
  },
  {
    id: 'AST-002',
    name: 'Dell UltraSharp 27"',
    type: 'Monitor',
    serialNumber: 'DELL-U27-9001',
    status: AssetStatus.IN_STOCK,
    purchaseDate: '2023-11-20',
    value: 12000000
  },
  {
    id: 'AST-003',
    name: 'Cisco Router C9200',
    type: 'Network Device',
    serialNumber: 'CS-C9200-881',
    status: AssetStatus.REPAIRING,
    purchaseDate: '2022-05-10',
    value: 25000000
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'T-1001',
    title: 'Lỗi kết nối máy in',
    description: 'Máy in HP tầng 3 không phản hồi qua mạng.',
    status: TicketStatus.OPEN,
    priority: TicketPriority.MEDIUM,
    category: 'Hardware',
    creatorId: 'u2',
    creatorName: 'John Doe',
    department: 'Marketing',
    subsidiary: 'VCHC',
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
    location: 'Floor 3'
  },
  {
    id: 'T-1002',
    title: 'Mạng chậm diện rộng',
    description: 'Tốc độ internet rất chậm tại phòng Marketing.',
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    category: 'Network',
    creatorId: 'u2',
    creatorName: 'John Doe',
    department: 'Marketing',
    subsidiary: 'VCHQ',
    assignedTo: 'admin',
    createdAt: '2024-03-21T09:15:00Z',
    updatedAt: '2024-03-21T11:00:00Z',
    location: 'Floor 2'
  }
];

export const LOCATIONS = SUBSIDIARIES;