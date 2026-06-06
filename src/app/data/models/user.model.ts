export enum UserType {
  Student = 'STUDENT',
  Administrator = 'ADMINISTRATOR'
}

export enum UserStatus {
  Deleted = 'Deleted',
  Active = 'Active',
  Pending = 'Pending'
}

export enum CustomerStatus {
  Inactive = 'Inactive',
  Active = 'Active',
  Pending = 'Pending'
}

export enum CertificateType {
  Pilot = 'Pilot',
  Instructor = 'Instructor',
  RemotePilot = 'Remote Pilot'
}

export interface TrainingProgram {
  id: string;
  name: string;
}

export interface StudentProfile {
  userId: number;
  fboId: number;
  firstName: string;
  lastName: string;
  role: UserType.Student;
  email: string;
  trainingProgram: TrainingProgram;
  timezone: string;
  avatarUrl?: string;
  status?: UserStatus;
  customerStatus?: CustomerStatus;
}

export interface AdministratorProfile {
  userId: number;
  fboId: number;
  firstName: string;
  lastName: string;
  role: UserType.Administrator;
  email: string;
  timezone: string;
  avatarUrl?: string;
  status?: UserStatus;
  customerStatus?: CustomerStatus;
}

export type UserProfile = StudentProfile | AdministratorProfile;

