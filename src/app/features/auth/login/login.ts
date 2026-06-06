import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';

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
  protected readonly dateTime = inject(DateTimeService);

  // loading visual states using signals
  protected readonly isLoading = signal<boolean>(false);
  protected readonly isBypassing = signal<boolean>(false);

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
  protected onBypassLogin(role: 'STUDENT' | 'ADMINISTRATOR'): void {
    this.isBypassing.set(true);
    
    // Simulate API delay before resolving
    setTimeout(() => {
      this.authService.setMockSession(role);
      this.isBypassing.set(false);
      
      if (role === 'ADMINISTRATOR') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/student']);
      }
    }, 800);
  }
}
