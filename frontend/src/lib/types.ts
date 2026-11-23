export type Role = 'ADMIN' | 'DEVOPS' | 'VIEWER';

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  _count?: { members: number; servers: number; applications: number };
  environments?: Environment[];
  members?: { id: string; role: string; user: User }[];
}

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  type: 'DEV' | 'STAGING' | 'PROD';
  url: string | null;
}

export interface Server {
  id: string;
  projectId: string | null;
  name: string;
  provider: string;
  region: string;
  cpuCores: number;
  ramGb: number;
  storageGb: number;
  ipAddress: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  project?: { id: string; name: string } | null;
  applications?: Application[];
}

export interface Application {
  id: string;
  name: string;
  version: string;
  status: 'RUNNING' | 'STOPPED' | 'FAILED' | 'DEPLOYING';
  server?: { id: string; name: string; ipAddress: string };
  environment?: { id?: string; name: string; type: string };
  project?: { id: string; name: string };
}

export interface Metric {
  id: string;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  isUp: boolean;
  recordedAt: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: 'CPU' | 'RAM' | 'DISK';
  operator: 'GT' | 'GTE' | 'LT' | 'LTE';
  threshold: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  enabled: boolean;
  server?: { id: string; name: string } | null;
}

export interface Alert {
  id: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  value: number;
  triggeredAt: string;
  resolvedAt: string | null;
  server: { id: string; name: string };
}

export interface DashboardSummary {
  totals: { projects: number; servers: number; applications: number; openAlerts: number };
  serversByStatus: Record<string, number>;
  applicationsByStatus: Record<string, number>;
  openAlertsBySeverity: Record<string, number>;
  averageUsage: { cpu: number | null; ram: number | null; disk: number | null };
  recentAlerts: Alert[];
}
