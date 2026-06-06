import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiService } from '../api/api.service';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let apiSpy: any;

  beforeEach(() => {
    localStorage.clear();
    apiSpy = {
      get: vi.fn(),
      post: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize unauthenticated by default', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should configure mock student sessions correctly', () => {
    service.setMockSession('STUDENT');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userRole()).toBe('STUDENT');
    expect(service.currentUser()?.firstName).toBe('Jane');
    expect(localStorage.getItem('access_token')).toBe('mock_token_value');
  });

  it('should configure mock administrator sessions correctly', () => {
    service.setMockSession('ADMINISTRATOR');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userRole()).toBe('ADMINISTRATOR');
    expect(service.currentUser()?.firstName).toBe('Alex');
  });

  it('should clear authentication state on logout', () => {
    service.setMockSession('STUDENT');
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('user_session')).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('should load initial session from localStorage on bootstrap', () => {
    const mockUser = {
      userId: 202,
      fboId: 1,
      firstName: 'Test',
      lastName: 'User',
      role: 'STUDENT',
      email: 'test@aviate.com',
      timezone: 'UTC'
    };
    localStorage.setItem('user_session', JSON.stringify(mockUser));
    localStorage.setItem('access_token', 'initial_token');

    // Re-create service using TestBed to test constructor loading within injection context
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });
    const newService = TestBed.inject(AuthService);
    expect(newService.isAuthenticated()).toBe(true);
    expect(newService.currentUser()?.userId).toBe(202);
  });

  it('should redirect to Flight Circle on login() and generate random state', () => {
    const mockLocation = { href: '' };
    vi.stubGlobal('location', mockLocation);

    service.login();

    expect(mockLocation.href).toContain('https://www.flightcircle.com/v1/api/pub/authorize');
    expect(mockLocation.href).toContain('client_id=2c69a89d4c2c6eb185fcdc9ecd5db9c7');
    expect(localStorage.getItem('oauth_state')).not.toBeNull();

    vi.unstubAllGlobals();
  });

  it('should exchange authorization code for tokens and user profile', () => {
    const mockUser = { userId: 202, firstName: 'Test', role: 'STUDENT' };
    apiSpy.post.mockReturnValue(of({ access_token: 'new_token_value' }));
    apiSpy.get.mockReturnValue(of(mockUser));

    service.exchangeCodeForToken('auth_code_123').subscribe(user => {
      expect(user).toEqual(mockUser as any);
      expect(localStorage.getItem('access_token')).toBe('new_token_value');
      expect(localStorage.getItem('user_session')).toContain('Test');
      expect(service.isAuthenticated()).toBe(true);
    });

    expect(apiSpy.post).toHaveBeenCalledWith('auth/token', {
      code: 'auth_code_123',
      client_id: '2c69a89d4c2c6eb185fcdc9ecd5db9c7',
      client_secret: '315e67185aa47608125fddebe0adfed7'
    });
    expect(apiSpy.get).toHaveBeenCalledWith('user/describe');
  });

  it('should clear session if cached session is invalid JSON', () => {
    localStorage.setItem('user_session', '{invalid-json');
    localStorage.setItem('access_token', 'mock_token');

    // Create a mock TestBed to reconstruct the service with mock apiSpy
    const spy = vi.spyOn(AuthService.prototype, 'logout');
    
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });
    const newService = TestBed.inject(AuthService);

    expect(spy).toHaveBeenCalled();
    expect(newService.isAuthenticated()).toBe(false);
    spy.mockRestore();
  });
});
