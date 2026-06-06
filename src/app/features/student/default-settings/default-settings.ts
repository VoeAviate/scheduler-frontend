import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { StudentAvailabilityService } from '../../../data/services/student-availability.service';
import { AdminConfigService } from '../../../data/services/admin-config.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { DefaultAvailability } from '../../../data/models/availability.model';

@Component({
  selector: 'aviate-default-availability',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './default-settings.html',
  styleUrl: './default-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefaultAvailabilityComponent {
  protected readonly availabilityService = inject(StudentAvailabilityService);
  protected readonly adminConfig = inject(AdminConfigService);
  protected readonly dateTime = inject(DateTimeService);
  private readonly router = inject(Router);

  // Local state for template modifications before saving
  protected readonly templateSelections = signal<DefaultAvailability[]>([]);
  protected readonly isSavedSuccess = signal<boolean>(false);

  // Mouse gestures state
  private isMouseDown = false;
  private selectionMode: 'select' | 'deselect' = 'select';

  // Weekdays (0 = Sunday, ..., 6 = Saturday)
  public readonly weekDays = [0, 1, 2, 3, 4, 5, 6];

  public readonly timeSlots = computed(() => {
    const hours = [];
    const working = this.adminConfig.workingHours();
    const startHour = parseInt(working.startTime.split(':')[0], 10);
    const endHour = parseInt(working.endTime.split(':')[0], 10);

    for (let h = startHour; h <= endHour; h++) {
      const formatted = h < 10 ? `0${h}:00` : `${h}:00`;
      hours.push(formatted);
    }
    return hours;
  });

  public readonly dayNames = computed(() => {
    const isEn = this.dateTime.locale() === 'en-US';
    return isEn 
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  });

  constructor() {
    // Initialize local selections from service cache
    const initial = this.availabilityService.defaultWeeklyTemplate();
    this.templateSelections.set([...initial]);
  }

  protected isSlotSelected(dayOfWeek: number, hour: string): boolean {
    const endTime = this.getEndTime(hour);
    return this.templateSelections().some(t => 
      t.dayOfWeek === dayOfWeek && t.startTime === hour && t.endTime === endTime
    );
  }

  // Mouse drag selection handlers
  protected onMouseDown(dayOfWeek: number, hour: string, event: MouseEvent): void {
    event.preventDefault();
    this.isMouseDown = true;
    
    const isSelected = this.isSlotSelected(dayOfWeek, hour);
    this.selectionMode = isSelected ? 'deselect' : 'select';

    this.toggleSlotState(dayOfWeek, hour);
  }

  protected onMouseEnter(dayOfWeek: number, hour: string): void {
    if (!this.isMouseDown) return;
    this.toggleSlotState(dayOfWeek, hour);
  }

  protected onMouseUp(): void {
    this.isMouseDown = false;
  }

  protected onSaveTemplate(): void {
    this.availabilityService.saveDefaultTemplate(this.templateSelections());
    this.isSavedSuccess.set(true);
    
    // Auto-hide success indicator after 2 seconds
    setTimeout(() => {
      this.isSavedSuccess.set(false);
    }, 2000);
  }

  protected onBackToCalendar(): void {
    this.router.navigate(['/student']);
  }

  private toggleSlotState(dayOfWeek: number, hour: string): void {
    const endTime = this.getEndTime(hour);
    const exists = this.isSlotSelected(dayOfWeek, hour);

    if (this.selectionMode === 'select' && !exists) {
      this.templateSelections.update(prev => [...prev, { dayOfWeek, startTime: hour, endTime }]);
    } else if (this.selectionMode === 'deselect' && exists) {
      this.templateSelections.update(prev => prev.filter(t => 
        !(t.dayOfWeek === dayOfWeek && t.startTime === hour && t.endTime === endTime)
      ));
    }
  }

  private getEndTime(startTime: string): string {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = startHour + 1;
    return endHour < 10 ? `0${endHour}:00` : `${endHour}:00`;
  }
}
