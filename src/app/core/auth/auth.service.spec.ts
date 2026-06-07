import { UserProfile, UserType, UserStatus, CustomerStatus } from '../../data/models/user.model';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiService } from '../api/api.service';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

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
    service.setMockSession(UserType.Student);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userRole()).toBe(UserType.Student);
    expect(service.currentUser()?.firstName).toBe('Jane');
    expect(localStorage.getItem('access_token')).toBe('mock_token_value');
  });

  it('should configure mock administrator sessions correctly', () => {
    service.setMockSession(UserType.Administrator);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.userRole()).toBe(UserType.Administrator);
    expect(service.currentUser()?.firstName).toBe('Alex');
  });

  it('should clear authentication state on logout', () => {
    service.setMockSession(UserType.Student);
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
      role: UserType.Student,
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
    expect(mockLocation.href).toContain(`client_id=${environment.flightCircleClientId}`);
    expect(mockLocation.href).toContain(`redirect_uri=${encodeURIComponent(environment.flightCircleRedirectUri)}`);
    expect(localStorage.getItem('oauth_state')).not.toBeNull();

    vi.unstubAllGlobals();
  });

  it('should exchange authorization code for tokens and user profile', () => {
    const apiResponse = [
      {
        UserID: 202,
        FboID: 1,
        first_name: 'Test',
        last_name: 'User',
        timezone_string: 'UTC',
        email: 'test@aviate.com',
        role: 'STUDENT'
      }
    ];
    const expectedUser: UserProfile = {
      userId: 202,
      fboId: 1,
      firstName: 'Test',
      lastName: 'User',
      role: UserType.Student,
      email: 'test@aviate.com',
      timezone: 'UTC',
      trainingProgram: { id: 'PPL', name: 'Private Pilot License' }
    };
    apiSpy.post.mockReturnValue(of({ access_token: 'new_token_value' }));
    apiSpy.get.mockReturnValue(of(apiResponse));

    service.exchangeCodeForToken('auth_code_123').subscribe(user => {
      expect(user).toEqual(expectedUser);
      expect(localStorage.getItem('access_token')).toBe('new_token_value');
      expect(localStorage.getItem('user_session')).toContain('Test');
      expect(service.isAuthenticated()).toBe(true);
    });

    expect(apiSpy.post).toHaveBeenCalledWith('auth/token', {
      code: 'auth_code_123',
      client_id: environment.flightCircleClientId,
      client_secret: environment.flightCircleClientSecret
    });
    expect(apiSpy.get).toHaveBeenCalledWith('user/describe');
  });

  it('should map administrator profile correctly during token exchange', () => {
    const apiResponse = [
      {
        UserID: 303,
        FboID: 2,
        first_name: 'Admin',
        last_name: 'User',
        timezone_string: 'America/New_York',
        email: 'admin@aviate.com',
        role: 'ADMINISTRATOR'
      }
    ];
    const expectedUser: UserProfile = {
      userId: 303,
      fboId: 2,
      firstName: 'Admin',
      lastName: 'User',
      role: UserType.Administrator,
      email: 'admin@aviate.com',
      timezone: 'America/New_York'
    };
    apiSpy.post.mockReturnValue(of({ access_token: 'admin_token' }));
    apiSpy.get.mockReturnValue(of(apiResponse));

    service.exchangeCodeForToken('auth_code_456').subscribe(user => {
      expect(user).toEqual(expectedUser);
      expect(service.userRole()).toBe(UserType.Administrator);
    });
  });

  it('should fallback to camelCase profile mapping correctly', () => {
    const camelUser = {
      userId: 404,
      fboId: 1,
      firstName: 'Camel',
      lastName: 'Case',
      role: 'STUDENT',
      email: 'camel@aviate.com',
      timezone: 'UTC'
    };
    apiSpy.post.mockReturnValue(of({ access_token: 'camel_token' }));
    apiSpy.get.mockReturnValue(of(camelUser));

    service.exchangeCodeForToken('auth_code_789').subscribe(user => {
      expect(user.userId).toBe(404);
      expect(user.firstName).toBe('Camel');
      expect(user.role).toBe(UserType.Student);
    });
  });


  it('should map Status and status to enums during token exchange', () => {
    const apiResponse = [
      {
        UserID: 505,
        FboID: 1,
        first_name: 'Status',
        last_name: 'Test',
        role: 'STUDENT',
        Status: 'Active',
        status: '1'
      }
    ];
    apiSpy.post.mockReturnValue(of({ access_token: 'token_status' }));
    apiSpy.get.mockReturnValue(of(apiResponse));

    service.exchangeCodeForToken('auth_code_status').subscribe(user => {
      expect(user.status).toBe(UserStatus.Active);
      expect(user.customerStatus).toBe(CustomerStatus.Active);
    });
  });

  it('should map different status variations correctly', () => {
    const inactiveUser = {
      UserID: 506,
      FboID: 1,
      first_name: 'Inactive',
      last_name: 'Test',
      role: 'STUDENT',
      Status: 'Pending',
      status: '0'
    };
    apiSpy.post.mockReturnValue(of({ access_token: 'token_status_2' }));
    apiSpy.get.mockReturnValue(of(inactiveUser));

    service.exchangeCodeForToken('auth_code_status_2').subscribe(user => {
      expect(user.status).toBe(UserStatus.Pending);
      expect(user.customerStatus).toBe(CustomerStatus.Inactive);
    });

    const pendingUser = {
      UserID: 507,
      FboID: 1,
      role: 'STUDENT',
      Status: 'Deleted',
      status: '2'
    };
    apiSpy.get.mockReturnValue(of(pendingUser));
    service.exchangeCodeForToken('auth_code_status_3').subscribe(user => {
      expect(user.status).toBe(UserStatus.Deleted);
      expect(user.customerStatus).toBe(CustomerStatus.Pending);
    });
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
