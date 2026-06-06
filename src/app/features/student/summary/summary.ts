import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentAvailabilityService } from '../../../data/services/student-availability.service';
import { AuthService } from '../../../core/auth/auth.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { AvailabilitySlot } from '../../../data/models/availability.model';

@Component({
  selector: 'aviate-availability-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvailabilitySummaryComponent {
  protected readonly availabilityService = inject(StudentAvailabilityService);
  protected readonly auth = inject(AuthService);
  protected readonly dateTime = inject(DateTimeService);

  // Modal display states
  protected readonly isModalOpen = signal<boolean>(false);

  // Grouped selections sorted by date and merged contiguously
  public readonly groupedSelections = computed(() => {
    const raw = this.availabilityService.selections();
    const groups: { [key: string]: AvailabilitySlot[] } = {};

    raw.forEach(slot => {
      if (!groups[slot.day]) {
        groups[slot.day] = [];
      }
      groups[slot.day].push(slot);
    });

    const result = [];
    const sortedDays = Object.keys(groups).sort();

    for (const day of sortedDays) {
      // Sort day's slots chronologically
      const slots = groups[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // Contiguous merges (e.g. 08:00-09:00 + 09:00-10:00 -> 08:00-10:00)
      const merged: { startTime: string; endTime: string }[] = [];
      slots.forEach(s => {
        if (merged.length === 0) {
          merged.push({ startTime: s.startTime, endTime: s.endTime });
        } else {
          const last = merged[merged.length - 1];
          if (last.endTime === s.startTime) {
            last.endTime = s.endTime; // merge contiguous blocks
          } else {
            merged.push({ startTime: s.startTime, endTime: s.endTime });
          }
        }
      });

      // Localized display day string
      let formattedDay = '';
      try {
        formattedDay = this.dateTime.formatToLocale(
          `${day}T00:00:00Z`, 
          { weekday: 'short', month: 'short', day: '2-digit' }
        );
      } catch {
        formattedDay = day;
      }

      result.push({
        day,
        formattedDay,
        slots: merged
      });
    }
    return result;
  });

  protected openConfirmModal(): void {
    if (this.availabilityService.selections().length > 0) {
      this.isModalOpen.set(true);
    }
  }

  protected closeConfirmModal(): void {
    this.isModalOpen.set(false);
  }

  protected onConfirmSubmit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.availabilityService.confirmAvailability(user.userId);
      this.closeConfirmModal();
    }
  }

  protected onApplyDefaultTemplate(): void {
    this.availabilityService.applyDefaultAvailability();
  }

  protected onCloseSuccessCheck(): void {
    this.availabilityService.resetSubmitSuccess();
  }
}
