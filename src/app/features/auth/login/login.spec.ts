import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/auth/auth.service';
import { signal } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      login: vi.fn(),
      setMockSession: vi.fn(),
      currentUser: signal(null),
      isAuthenticated: signal(false),
      userRole: signal(null)
    };

    routerSpy = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call login on AuthService and set isLoading when onLoginWithFlightCircle is called', () => {
    component['onLoginWithFlightCircle']();
    expect(component['isLoading']()).toBe(true);
    expect(authServiceSpy.login).toHaveBeenCalled();
  });

  it('should handle STUDENT bypass login correctly', () => {
    vi.useFakeTimers();
    component['onBypassLogin']('STUDENT');
    expect(component['isBypassing']()).toBe(true);

    vi.advanceTimersByTime(800);

    expect(authServiceSpy.setMockSession).toHaveBeenCalledWith('STUDENT');
    expect(component['isBypassing']()).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/student']);
    vi.useRealTimers();
  });

  it('should handle ADMINISTRATOR bypass login correctly', () => {
    vi.useFakeTimers();
    component['onBypassLogin']('ADMINISTRATOR');
    expect(component['isBypassing']()).toBe(true);

    vi.advanceTimersByTime(800);

    expect(authServiceSpy.setMockSession).toHaveBeenCalledWith('ADMINISTRATOR');
    expect(component['isBypassing']()).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
    vi.useRealTimers();
  });
});
