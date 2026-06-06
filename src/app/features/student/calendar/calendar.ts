import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentAvailabilityService } from '../../../data/services/student-availability.service';
import { AdminConfigService } from '../../../data/services/admin-config.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { AvailabilitySlot } from '../../../data/models/availability.model';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks, 
  format, 
  isSameMonth, 
  parseISO, 
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  isSameDay
} from 'date-fns';

@Component({
  selector: 'aviate-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent {
  protected readonly availabilityService = inject(StudentAvailabilityService);
  protected readonly adminConfig = inject(AdminConfigService);
  protected readonly dateTime = inject(DateTimeService);

  // Writable signal tracking the active week's start date
  protected get currentWeekStart() { return this.availabilityService.currentWeekStart; }

  // Track selection gesture states
  private isMouseDown = false;
  private selectionMode: 'select' | 'deselect' = 'select';
  private gestureStartSlot: { day: string; hour: string } | null = null;

  // Computed signals
  public readonly releasedMonthDate = computed(() => {
    const released = this.adminConfig.releasedMonth();
    if (!released) return new Date();
    return new Date(released.year, released.month - 1, 1);
  });

  public readonly weekDays = computed(() => {
    const start = startOfWeek(this.currentWeekStart(), { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(start, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  });

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

  public readonly displayHeader = computed(() => {
    const released = this.adminConfig.releasedMonth();
    if (!released) return '';
    // Custom formatted localized header e.g. "July 2026"
    return this.dateTime.formatToLocale(
      this.releasedMonthDate().toISOString(),
      { month: 'long', year: 'numeric' }
    );
  });

  public readonly canNavigatePrev = computed(() => {
    const prevWeek = subWeeks(this.currentWeekStart(), 1);
    return this.isWeekInReleasedMonth(prevWeek);
  });

  public readonly canNavigateNext = computed(() => {
    const nextWeek = addWeeks(this.currentWeekStart(), 1);
    return this.isWeekInReleasedMonth(nextWeek);
  });

  constructor() {
    // Sync current week view when released month changes
    effect(() => {
      const startOfReleased = startOfMonth(this.releasedMonthDate());
      this.currentWeekStart.set(startOfWeek(startOfReleased, { weekStartsOn: 0 }));
    }, { allowSignalWrites: true });
  }

  protected navigatePrevWeek(): void {
    if (this.canNavigatePrev()) {
      this.currentWeekStart.update(d => subWeeks(d, 1));
    }
  }

  protected navigateNextWeek(): void {
    if (this.canNavigateNext()) {
      this.currentWeekStart.update(d => addWeeks(d, 1));
    }
  }

  /**
   * Helper checks if day is part of the released month.
   */
  public isDayDisabled(day: Date): boolean {
    const released = this.adminConfig.releasedMonth();
    if (!released) return true;
    return day.getMonth() !== (released.month - 1) || day.getFullYear() !== released.year;
  }

  /**
   * Check if a specific hour block is currently selected by the student.
   */
  public isSlotSelected(day: Date, hour: string): boolean {
    const dayStr = this.dateTime.formatToIsoDate(day);
    const endTime = this.getEndTime(hour);
    return this.availabilityService.selections().some(slot => 
      slot.day === dayStr && slot.startTime === hour && slot.endTime === endTime
    );
  }

  // Mouse selection gestures handlers
  protected onMouseDown(day: Date, hour: string, event: MouseEvent): void {
    if (this.isDayDisabled(day)) return;
    event.preventDefault();

    this.isMouseDown = true;
    const dayStr = this.dateTime.formatToIsoDate(day);
    const isCurrentlySelected = this.isSlotSelected(day, hour);

    this.selectionMode = isCurrentlySelected ? 'deselect' : 'select';
    this.gestureStartSlot = { day: dayStr, hour };

    this.toggleSlotState(dayStr, hour);
  }

  protected onMouseEnter(day: Date, hour: string): void {
    if (!this.isMouseDown || this.isDayDisabled(day) || !this.gestureStartSlot) return;
    const dayStr = this.dateTime.formatToIsoDate(day);
    
    // Drag selection: fill intermediate items
    this.toggleSlotState(dayStr, hour);
  }

  protected onMouseUp(): void {
    this.isMouseDown = false;
    this.gestureStartSlot = null;
  }

  private toggleSlotState(dayStr: string, hour: string): void {
    const endTime = this.getEndTime(hour);
    const slot: AvailabilitySlot = { day: dayStr, startTime: hour, endTime };

    if (this.selectionMode === 'select') {
      this.availabilityService.addSlot(slot);
    } else {
      this.availabilityService.removeSlot(slot);
    }
  }

  private getEndTime(startTime: string): string {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = startHour + 1;
    return endHour < 10 ? `0${endHour}:00` : `${endHour}:00`;
  }

  private isWeekInReleasedMonth(weekDate: Date): boolean {
    const released = this.adminConfig.releasedMonth();
    if (!released) return false;

    const startOfReleased = startOfMonth(this.releasedMonthDate());
    const endOfReleased = endOfMonth(this.releasedMonthDate());
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekDate, { weekStartsOn: 0 });

    // Check if the week interval overlaps with the released month interval
    return (
      (weekStart >= startOfReleased && weekStart <= endOfReleased) ||
      (weekEnd >= startOfReleased && weekEnd <= endOfReleased) ||
      (weekStart <= startOfReleased && weekEnd >= endOfReleased)
    );
  }
}
