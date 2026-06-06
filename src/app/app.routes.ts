import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { StudentDashboardComponent } from './features/student/dashboard/dashboard';
import { StudentScheduleComponent } from './features/student/schedule/schedule';
import { DefaultAvailabilityComponent } from './features/student/default-settings/default-settings';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard';
import { authGuard, loginGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard]
  },
  {
    path: 'auth/callback',
    component: LoginComponent
  },
  {
    path: 'student',
    component: StudentDashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'schedule'
      },
      {
        path: 'schedule',
        component: StudentScheduleComponent
      },
      {
        path: 'default',
        component: DefaultAvailabilityComponent
      }
    ]
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
