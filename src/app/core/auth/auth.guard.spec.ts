import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authGuard, loginGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';
import { UserType } from '../../data/models/user.model';

describe('AuthGuards', () => {
  let authServiceSpy: any;
  let routerSpy: Router;

  beforeEach(() => {
    authServiceSpy = {
      isAuthenticated: signal(false),
      userRole: signal<UserType | null>(null)
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    routerSpy = TestBed.inject(Router);
    vi.spyOn(routerSpy, 'navigate').mockImplementation(() => Promise.resolve(true));
  });

  describe('authGuard', () => {
    it('should allow access if authenticated', () => {
      authServiceSpy.isAuthenticated.set(true);
      
      const result = TestBed.runInInjectionContext(() => {
        return authGuard({} as any, {} as any);
      });

      expect(result).toBe(true);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect to login if unauthenticated', () => {
      authServiceSpy.isAuthenticated.set(false);
      
      const result = TestBed.runInInjectionContext(() => {
        return authGuard({} as any, {} as any);
      });

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('loginGuard', () => {
    it('should allow access to login page if unauthenticated', () => {
      authServiceSpy.isAuthenticated.set(false);

      const result = TestBed.runInInjectionContext(() => {
        return loginGuard({} as any, {} as any);
      });

      expect(result).toBe(true);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should redirect ADMINISTRATOR to /admin if authenticated', () => {
      authServiceSpy.isAuthenticated.set(true);
      authServiceSpy.userRole.set(UserType.Administrator);

      const result = TestBed.runInInjectionContext(() => {
        return loginGuard({} as any, {} as any);
      });

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should redirect STUDENT to /student if authenticated', () => {
      authServiceSpy.isAuthenticated.set(true);
      authServiceSpy.userRole.set(UserType.Student);

      const result = TestBed.runInInjectionContext(() => {
        return loginGuard({} as any, {} as any);
      });

      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/student']);
    });
  });
});

