import { Injectable, signal, computed, inject } from '@angular/core';
import { UserProfile, UserType, UserStatus, CustomerStatus } from '../../data/models/user.model';
import { ApiService } from '../api/api.service';
import { Observable } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';

declare const process: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiService = inject(ApiService);

  // Source of truth signal for authentication state
  private readonly _currentUser = signal<UserProfile | null>(null);

  // Read-only signals exposed to components
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);
  public readonly userRole = computed(() => this._currentUser()?.role || null);

  constructor() {
    this.checkLocalStorageSession();
  }

  /**
   * Triggers the Flight Circle OAuth2 flow.
   * In local environment, it uses client_id and redirects to Flight Circle authorize page.
   */
  public login(): void {
    const clientId = (typeof process !== 'undefined' && process.env?.['FLIGHT_CIRCLE_CLIENT_ID']) || '2c69a89d4c2c6eb185fcdc9ecd5db9c7';
    const state = this.generateRandomState();
    const scopes = 'user fbo write';

    // Store state in localStorage for callback CSRF verification
    localStorage.setItem('oauth_state', state);

    // Build the Flight Circle Authorize URL
    const authUrl = `https://www.flightcircle.com/v1/api/pub/authorize?client_id=${clientId}&state=${state}&scope=${encodeURIComponent(scopes)}&response_type=code`;

    // Redirect user to authorization page
    window.location.href = authUrl;
  }

  /**
   * Exchanges authorization code for access token via backend proxy,
   * then fetches and caches the user profile.
   */
  public exchangeCodeForToken(code: string): Observable<UserProfile> {
    const clientId = (typeof process !== 'undefined' && process.env?.['FLIGHT_CIRCLE_CLIENT_ID']) || '2c69a89d4c2c6eb185fcdc9ecd5db9c7';
    const clientSecret = (typeof process !== 'undefined' && process.env?.['FLIGHT_CIRCLE_CLIENT_SECRET']) || '315e67185aa47608125fddebe0adfed7';

    return this.apiService.post<{ access_token: string }>('auth/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret
    }).pipe(
      switchMap(res => {
        localStorage.setItem('access_token', res.access_token);
        // GET /user/describe returns an array of FBO profiles
        return this.apiService.get<any>('user/describe');
      }),
      map(response => {
        const apiUser = Array.isArray(response) ? response[0] : response;
        if (!apiUser) {
          throw new Error('No user profile found');
        }

        // Robust mapping from API response (PascalCase/snake_case) to internal properties
        const userId = apiUser.UserID !== undefined ? apiUser.UserID : apiUser.userId;
        const fboId = apiUser.FboID !== undefined ? apiUser.FboID : apiUser.fboId;
        const firstName = apiUser.first_name !== undefined ? apiUser.first_name : apiUser.firstName;
        const lastName = apiUser.last_name !== undefined ? apiUser.last_name : apiUser.lastName;
        const email = apiUser.email;
        const timezone = apiUser.timezone_string !== undefined ? apiUser.timezone_string : apiUser.timezone;
        
        let role: UserType;
        const rawRole = apiUser.role || apiUser.custom_fields?.['role'];
        if (rawRole === 'ADMINISTRATOR' || rawRole === UserType.Administrator) {
          role = UserType.Administrator;
        } else {
          role = UserType.Student;
        }

        let customerStatus: CustomerStatus | undefined;
        if (apiUser.status !== undefined) {
          if (apiUser.status === '0' || apiUser.status === 0) {
            customerStatus = CustomerStatus.Inactive;
          } else if (apiUser.status === '1' || apiUser.status === 1) {
            customerStatus = CustomerStatus.Active;
          } else if (apiUser.status === '2' || apiUser.status === 2) {
            customerStatus = CustomerStatus.Pending;
          }
        }

        const user: UserProfile = {
          userId,
          fboId,
          firstName,
          lastName,
          role,
          email,
          timezone: timezone || 'America/New_York',
          ...(apiUser.avatarUrl ? { avatarUrl: apiUser.avatarUrl } : {}),
          ...(apiUser.Status ? { status: apiUser.Status as UserStatus } : {}),
          ...(customerStatus ? { customerStatus } : {}),
          ...(role === UserType.Student ? {
            trainingProgram: apiUser.trainingProgram || apiUser.custom_fields?.['trainingProgram'] || { id: 'PPL', name: 'Private Pilot License' }
          } : {})
        } as UserProfile;

        return user;
      }),
      tap(user => {
        localStorage.setItem('user_session', JSON.stringify(user));
        this._currentUser.set(user);
      })
    );
  }

  /**
   * Logs out the user and clears sessions.
   */
  public logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem('user_session');
    localStorage.removeItem('access_token');
  }

  /**
   * Simulates authentication (e.g. mock session setting for dev/testing)
   */
  public setMockSession(role: UserType): void {
    let mockUser: UserProfile;

    if (role === UserType.Student) {
      mockUser = {
        userId: 101,
        fboId: 1,
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserType.Student,
        email: 'jane.doe@example.com',
        trainingProgram: { id: 'PPL', name: 'Private Pilot License' },
        timezone: 'America/New_York'
      };
    } else {
      mockUser = {
        userId: 102,
        fboId: 1,
        firstName: 'Alex',
        lastName: 'Smith',
        role: UserType.Administrator,
        email: 'alex.smith@example.com',
        timezone: 'America/New_York'
      };
    }

    localStorage.setItem('user_session', JSON.stringify(mockUser));
    localStorage.setItem('access_token', 'mock_token_value');
    this._currentUser.set(mockUser);
  }

  private checkLocalStorageSession(): void {
    const cachedUser = localStorage.getItem('user_session');
    const token = localStorage.getItem('access_token');
    
    if (cachedUser && token) {
      try {
        this._currentUser.set(JSON.parse(cachedUser));
      } catch {
        this.logout();
      }
    }
  }

  private generateRandomState(): string {
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
  }
}
