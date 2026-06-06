import { Injectable, signal, computed } from '@angular/core';
import { UserProfile } from '../../data/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
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
    const clientId = 'mock_client_id_aviate_scheduler_12345'; // Configured client_id
    const state = this.generateRandomState();
    const scopes = 'user fbo write';
    const redirectUri = encodeURIComponent('http://localhost:4200/auth/callback');

    // Store state in localStorage for callback CSRF verification
    localStorage.setItem('oauth_state', state);

    // Build the Flight Circle Authorize URL
    const authUrl = `https://www.flightcircle.com/v1/api/pub/authorize?client_id=${clientId}&state=${state}&scope=${encodeURIComponent(scopes)}&response_type=code`;

    // Redirect user to authorization page
    window.location.href = authUrl;
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
  public setMockSession(role: 'STUDENT' | 'ADMINISTRATOR'): void {
    let mockUser: UserProfile;

    if (role === 'STUDENT') {
      mockUser = {
        userId: 101,
        fboId: 1,
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'STUDENT',
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
        role: 'ADMINISTRATOR',
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
