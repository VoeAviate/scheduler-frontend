import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { UserType } from '../../../data/models/user.model';

@Component({
  selector: 'aviate-top-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent {
  protected readonly UserType = UserType;
  protected readonly auth = inject(AuthService);
  protected readonly dateTime = inject(DateTimeService);
  private readonly router = inject(Router);

  // Writable signal controlling drawer visual open state
  protected readonly isDrawerOpen = signal<boolean>(false);

  /**
   * Toggles the navigation sidebar drawer.
   */
  protected toggleDrawer(): void {
    this.isDrawerOpen.update(open => !open);
  }

  /**
   * Closes the navigation drawer.
   */
  protected closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  /**
   * Toggles the application language between English and Portuguese.
   */
  protected toggleLanguage(): void {
    const current = this.dateTime.locale();
    const next = current === 'en-US' ? 'pt-BR' : 'en-US';
    this.dateTime.setLocale(next);
  }

  /**
   * Updates the application language based on dropdown select selection.
   */
  protected onLanguageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.dateTime.setLocale(select.value as 'en-US' | 'pt-BR');
  }

  /**
   * Triggers logout and redirects back to Login view.
   */
  protected onLogout(): void {
    this.closeDrawer();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
