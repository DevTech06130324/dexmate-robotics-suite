export interface User {
  id: number;
  name: string;
  email: string;
}

export type GroupRole = 'admin' | 'member';

export interface GroupMember {
  user_id: number;
  name: string;
  email: string;
  role: GroupRole;
}

export interface Group {
  id: number;
  name: string;
  created_at?: string;
  role?: GroupRole;
  members?: GroupMember[];
}

export type RobotPermissionLevel = 'usage' | 'admin' | 'owner';
export type RobotOwnershipType = 'personal' | 'group';

export interface Robot {
  id: number;
  serial_number: string;
  name: string;
  model?: string;
  owner_type: 'user' | 'group';
  owner_user_id?: number | null;
  owner_group_id?: number | null;
  permission_level: RobotPermissionLevel;
  ownership_type: RobotOwnershipType;
}

export interface RobotDetails extends Robot {
  created_at?: string;
}

export interface RobotPermission {
  id: number;
  user_id: number;
  robot_id: number;
  permission_type: RobotPermissionLevel;
  granted_by?: number;
  granted_at?: string;
  name?: string;
  email?: string;
}

export interface RobotSettings {
  id?: number;
  user_id: number;
  robot_id: number;
  settings: Record<string, unknown>;
  updated_at?: string;
}

export type SettingsPayload = Record<string, unknown>;
