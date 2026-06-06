import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { UserType } from '../../../data/models/user.model';

@Component({
  selector: 'aviate-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly dateTime = inject(DateTimeService);
  protected readonly UserType = UserType;

  // loading visual states using signals
  protected readonly isLoading = signal<boolean>(false);
  protected readonly isBypassing = signal<boolean>(false);

  constructor() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];
      if (code && state) {
        this.handleAuthCallback(code, state);
      }
    });
  }

  /**
   * Redirects the user to the Flight Circle OAuth2 flow.
   */
  protected onLoginWithFlightCircle(): void {
    this.isLoading.set(true);
    // AuthService will redirect window.location
    this.authService.login();
  }

  /**
   * Quick bypass logins for local testing/demo purposes.
   */
  protected onBypassLogin(role: UserType): void {
    this.isBypassing.set(true);
    
    // Simulate API delay before resolving
    setTimeout(() => {
      this.authService.setMockSession(role);
      this.isBypassing.set(false);
      
      if (role === UserType.Administrator) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/student']);
      }
    }, 800);
  }

  private handleAuthCallback(code: string, state: string): void {
    const savedState = localStorage.getItem('oauth_state');
    if (state !== savedState) {
      console.error('CSRF state mismatch!');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.authService.exchangeCodeForToken(code).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        if (user.role === UserType.Administrator) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/student']);
        }
      },
      error: (err) => {
        console.error('Authentication failed:', err);
        this.isLoading.set(false);
      }
    });
  }
}

