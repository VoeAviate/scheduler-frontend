import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService]
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

    // Re-create service to test constructor loading
    const newService = new AuthService();
    expect(newService.isAuthenticated()).toBe(true);
    expect(newService.currentUser()?.userId).toBe(202);
  });

  it('should redirect to Flight Circle on login() and generate random state', () => {
    const mockLocation = { href: '' };
    vi.stubGlobal('location', mockLocation);

    service.login();

    expect(mockLocation.href).toContain('https://www.flightcircle.com/v1/api/pub/authorize');
    expect(mockLocation.href).toContain('client_id=mock_client_id_aviate_scheduler_12345');
    expect(localStorage.getItem('oauth_state')).not.toBeNull();

    vi.unstubAllGlobals();
  });

  it('should clear session if cached session is invalid JSON', () => {
    localStorage.setItem('user_session', '{invalid-json');
    localStorage.setItem('access_token', 'mock_token');

    const logoutSpy = vi.spyOn(AuthService.prototype, 'logout');
    const newService = new AuthService();

    expect(logoutSpy).toHaveBeenCalled();
    expect(newService.isAuthenticated()).toBe(false);
    logoutSpy.mockRestore();
  });
});
