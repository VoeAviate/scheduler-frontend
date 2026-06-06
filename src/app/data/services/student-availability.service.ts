import { Injectable, signal, computed, inject } from '@angular/core';
import { AvailabilitySlot, DefaultAvailability } from '../models/availability.model';
import { AdminConfigService } from './admin-config.service';
import { ApiService } from '../../core/api/api.service';
import { LoggerService } from '../../core/logging/logger.service';
import { DateTimeService } from '../../core/date-time/date-time.service';
import { parseISO, getDay, eachDayOfInterval, format } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class StudentAvailabilityService {
  private readonly adminConfig = inject(AdminConfigService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly dateTime = inject(DateTimeService);

  // Key names for LocalStorage
  private readonly CACHE_KEY = 'aviate_availability_draft';
  private readonly TEMPLATE_KEY = 'aviate_weekly_template';

  // Writable state signals (Source of Truth)
  private readonly _selections = signal<AvailabilitySlot[]>([]);
  private readonly _defaultWeeklyTemplate = signal<DefaultAvailability[]>([]);
  private readonly _isSubmitting = signal<boolean>(false);
  private readonly _isSubmitSuccess = signal<boolean>(false); // Triggers "Green Check" visual confirmation

  // Public read-only signals
  public readonly selections = this._selections.asReadonly();
  public readonly defaultWeeklyTemplate = this._defaultWeeklyTemplate.asReadonly();
  public readonly isSubmitting = this._isSubmitting.asReadonly();
  public readonly isSubmitSuccess = this._isSubmitSuccess.asReadonly();

  // Computed state helper signals
  public readonly totalSelectedHours = computed(() => {
    return this._selections().reduce((total, slot) => {
      // Slot times are ISO UTC or local HH:mm
      // Calculate delta
      return total + this.getSlotDuration(slot);
    }, 0);
  });

  constructor() {
    this.loadCache();
  }

  /**
   * Adds an availability slot.
   */
  public addSlot(slot: AvailabilitySlot): void {
    const exists = this._selections().some(s => this.areSlotsEqual(s, slot));
    if (!exists) {
      this._selections.update(prev => [...prev, slot]);
      this.saveCache();
      this.logger.trackEvent('add_slot', 'StudentAvailability', `${slot.day} ${slot.startTime}-${slot.endTime}`);
    }
  }

  /**
   * Removes an availability slot.
   */
  public removeSlot(slot: AvailabilitySlot): void {
    this._selections.update(prev => prev.filter(s => !this.areSlotsEqual(s, slot)));
    this.saveCache();
    this.logger.trackEvent('remove_slot', 'StudentAvailability', `${slot.day} ${slot.startTime}-${slot.endTime}`);
  }

  /**
   * Saves or updates the Default Weekly Template (Sunday-Saturday).
   */
  public saveDefaultTemplate(template: DefaultAvailability[]): void {
    this._defaultWeeklyTemplate.set(template);
    localStorage.setItem(this.TEMPLATE_KEY, JSON.stringify(template));
    this.logger.trackEvent('save_weekly_template', 'StudentAvailability');
  }

  /**
   * Clears the submit success visual state.
   */
  public resetSubmitSuccess(): void {
    this._isSubmitSuccess.set(false);
  }

  /**
   * Applies the Default Weekly Template across all days of the released month.
   */
  public applyDefaultAvailability(): void {
    const releasedMonth = this.adminConfig.releasedMonth();
    if (!releasedMonth) {
      this.logger.warn('Cannot apply default template: No released month found.');
      return;
    }

    const template = this._defaultWeeklyTemplate();
    if (template.length === 0) {
      this.logger.warn('Cannot apply default template: Template is empty.');
      return;
    }

    // Determine the date range of the released month
    const startYear = releasedMonth.year;
    const startMonth = releasedMonth.month - 1; // JS months are 0-indexed
    const startDate = new Date(startYear, startMonth, 1);
    const endDate = new Date(startYear, startMonth + 1, 0); // Last day of month

    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    const newSlots: AvailabilitySlot[] = [];

    daysInMonth.forEach(day => {
      const dayOfWeek = getDay(day); // 0 = Sunday, 1 = Monday, etc.
      const matchedTemplates = template.filter(t => t.dayOfWeek === dayOfWeek);

      matchedTemplates.forEach(t => {
        newSlots.push({
          day: this.dateTime.formatToIsoDate(day),
          startTime: t.startTime,
          endTime: t.endTime
        });
      });
    });

    this._selections.set(newSlots);
    this.saveCache();
    this.logger.trackEvent('apply_default_template', 'StudentAvailability', `Applied ${newSlots.length} slots`);
  }

  /**
   * Confirms and submits the availability slots to the Backend API.
   * On success, clears localStorage cache.
   */
  public confirmAvailability(userId: number): void {
    if (this._selections().length === 0) {
      this.logger.warn('Cannot submit: Selections are empty.');
      return;
    }

    this._isSubmitting.set(true);
    this._isSubmitSuccess.set(false);

    // Call resilient backend API endpoint
    this.api.post(`student/availability/${userId}`, { slots: this._selections() }).subscribe({
      next: () => {
        this._isSubmitting.set(false);
        this._isSubmitSuccess.set(true);
        this.clearCache();
        this.logger.trackEvent('confirm_availability_success', 'StudentAvailability', `Submitted ${this._selections().length} slots`);
      },
      error: (err) => {
        this._isSubmitting.set(false);
        this.logger.error('Failed to submit availability selections', err);
        // Retain cache in localStorage on failure to prevent data loss
      }
    });
  }

  private loadCache(): void {
    // 1. Load availability draft selections
    const cachedDraft = localStorage.getItem(this.CACHE_KEY);
    if (cachedDraft) {
      try {
        this._selections.set(JSON.parse(cachedDraft));
      } catch (e) {
        this.logger.error('Failed to parse cached availability selections draft', e);
      }
    }

    // 2. Load weekly template template
    const cachedTemplate = localStorage.getItem(this.TEMPLATE_KEY);
    if (cachedTemplate) {
      try {
        this._defaultWeeklyTemplate.set(JSON.parse(cachedTemplate));
      } catch (e) {
        this.logger.error('Failed to parse cached weekly template', e);
      }
    }
  }

  private saveCache(): void {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(this._selections()));
  }

  private clearCache(): void {
    this._selections.set([]);
    localStorage.removeItem(this.CACHE_KEY);
  }

  private areSlotsEqual(a: AvailabilitySlot, b: AvailabilitySlot): boolean {
    return a.day === b.day && a.startTime === b.startTime && a.endTime === b.endTime;
  }

  private getSlotDuration(slot: AvailabilitySlot): number {
    // Combines and gets durations in hours
    try {
      const combinedStart = `${slot.day}T${slot.startTime}:00`;
      const combinedEnd = `${slot.day}T${slot.endTime}:00`;
      const parsedStart = parseISO(combinedStart);
      const parsedEnd = parseISO(combinedEnd);
      const diff = this.dateTime.getDifferenceInHours(parsedStart, parsedEnd);
      return isNaN(diff) ? 0 : diff;
    } catch {
      return 0;
    }
  }
}
