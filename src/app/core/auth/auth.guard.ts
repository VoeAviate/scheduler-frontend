import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserType } from '../../data/models/user.model';

/**
 * Route guard to ensure the user is authenticated.
 * Redirects to /login if unauthenticated.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page
  router.navigate(['/login']);
  return false;
};

/**
 * Route guard to prevent authenticated users from visiting the login page.
 * Redirects to dashboard/home page based on their role if they are already logged in.
 */
export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const role = authService.userRole();
    if (role === UserType.Administrator) {
      router.navigate(['/admin']);
    } else {
      router.navigate(['/student']);
    }
    return false;
  }

  return true;
};

