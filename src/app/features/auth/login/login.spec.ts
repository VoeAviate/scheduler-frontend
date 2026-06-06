import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/auth/auth.service';
import { signal } from '@angular/core';
import { BehaviorSubject, of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authServiceSpy: any;
  let routerSpy: any;
  let queryParamsSubject: BehaviorSubject<any>;

  beforeEach(() => {
    queryParamsSubject = new BehaviorSubject<any>({});

    authServiceSpy = {
      login: vi.fn(),
      setMockSession: vi.fn(),
      exchangeCodeForToken: vi.fn().mockReturnValue(of({ userId: 101, role: 'STUDENT' })),
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
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject } }
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

  it('should reject callback with CSRF state mismatch', () => {
    localStorage.setItem('oauth_state', 'expected_state');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    component['handleAuthCallback']('some_code', 'wrong_state');

    expect(consoleSpy).toHaveBeenCalledWith('CSRF state mismatch!');
    expect(authServiceSpy.exchangeCodeForToken).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should exchange code for student token and redirect to student dashboard', () => {
    localStorage.setItem('oauth_state', 'expected_state');
    authServiceSpy.exchangeCodeForToken.mockReturnValue(of({ role: 'STUDENT' }));

    component['handleAuthCallback']('some_code', 'expected_state');

    expect(authServiceSpy.exchangeCodeForToken).toHaveBeenCalledWith('some_code');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/student']);
  });

  it('should exchange code for admin token and redirect to admin dashboard', () => {
    localStorage.setItem('oauth_state', 'expected_state');
    authServiceSpy.exchangeCodeForToken.mockReturnValue(of({ role: 'ADMINISTRATOR' }));

    component['handleAuthCallback']('some_code', 'expected_state');

    expect(authServiceSpy.exchangeCodeForToken).toHaveBeenCalledWith('some_code');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should handle token exchange failure gracefully', () => {
    localStorage.setItem('oauth_state', 'expected_state');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authServiceSpy.exchangeCodeForToken.mockReturnValue(throwError(() => new Error('Exchange failed')));

    component['handleAuthCallback']('some_code', 'expected_state');

    expect(authServiceSpy.exchangeCodeForToken).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Authentication failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
