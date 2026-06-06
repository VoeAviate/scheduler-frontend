import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminConfigService, ReleasedMonth } from '../../../data/services/admin-config.service';
import { LoggerService } from '../../../core/logging/logger.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';

@Component({
  selector: 'aviate-release-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './release-manager.html',
  styleUrl: './release-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReleaseManagerComponent {
  protected readonly configService = inject(AdminConfigService);
  private readonly logger = inject(LoggerService);
  protected readonly dateTime = inject(DateTimeService);

  // loading trigger signals
  protected readonly isReleasing = signal<boolean>(false);
  protected readonly isReleaseSuccess = signal<boolean>(false);

  // Month select options
  protected readonly years = [2026, 2027];
  
  // Computed translated months
  protected readonly months = computed(() => {
    const isPt = this.dateTime.locale() === 'pt-BR';
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const names = isPt ? monthNamesPt : monthNamesEn;
    return names.map((name, i) => ({ value: i + 1, name }));
  });

  // Selected state signals
  protected readonly selectedMonth = signal<number>(8); // Defaults to August
  protected readonly selectedYear = signal<number>(2026);

  protected onMonthChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedMonth.set(parseInt(select.value, 10));
  }

  protected onYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedYear.set(parseInt(select.value, 10));
  }

  protected onReleaseMonth(): void {
    this.isReleasing.set(true);
    this.isReleaseSuccess.set(false);

    // Mock API release trigger to send emails & WhatsApp notifications
    setTimeout(() => {
      const monthObj: ReleasedMonth = {
        year: this.selectedYear(),
        month: this.selectedMonth()
      };
      
      this.configService.updateReleasedMonth(monthObj);
      this.isReleasing.set(false);
      this.isReleaseSuccess.set(true);
      this.logger.trackEvent('release_new_month', 'AdminDashboard', `${monthObj.year}-${monthObj.month}`);

      // Auto-hide alert after 3 seconds
      setTimeout(() => {
        this.isReleaseSuccess.set(false);
      }, 3000);
    }, 1200);
  }
}
