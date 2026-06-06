export interface TrainingProgram {
  id: string;
  name: string;
}

export interface StudentProfile {
  userId: number;
  fboId: number;
  firstName: string;
  lastName: string;
  role: 'STUDENT';
  email: string;
  trainingProgram: TrainingProgram;
  timezone: string;
  avatarUrl?: string;
}

export interface AdministratorProfile {
  userId: number;
  fboId: number;
  firstName: string;
  lastName: string;
  role: 'ADMINISTRATOR';
  email: string;
  timezone: string;
  avatarUrl?: string;
}

export type UserProfile = StudentProfile | AdministratorProfile;
