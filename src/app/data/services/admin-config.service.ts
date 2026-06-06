import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { LoggerService } from '../../core/logging/logger.service';

export interface ReleasedMonth {
  year: number;
  month: number; // 1-12
}

export interface WorkingHours {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

@Injectable({
  providedIn: 'root'
})
export class AdminConfigService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  // Writable private signals
  private readonly _releasedMonth = signal<ReleasedMonth | null>({ year: 2026, month: 7 }); // Default release July 2026
  private readonly _workingHours = signal<WorkingHours>({ startTime: '06:00', endTime: '21:00' });
  private readonly _minAircraftInterval = signal<number>(30); // 30 minutes
  
  // Mission defaults in minutes
  private readonly _defaultBriefing = signal<number>(30);
  private readonly _defaultDebriefing = signal<number>(30);
  private readonly _defaultMission = signal<number>(90);

  // Exposed read-only signals
  public readonly releasedMonth = this._releasedMonth.asReadonly();
  public readonly workingHours = this._workingHours.asReadonly();
  public readonly minAircraftInterval = this._minAircraftInterval.asReadonly();
  public readonly defaultBriefing = this._defaultBriefing.asReadonly();
  public readonly defaultDebriefing = this._defaultDebriefing.asReadonly();
  public readonly defaultMission = this._defaultMission.asReadonly();

  constructor() {
    this.fetchServerConfig();
  }

  /**
   * Updates the released month settings.
   */
  public updateReleasedMonth(month: ReleasedMonth): void {
    this._releasedMonth.set(month);
    this.logger.trackEvent('update_released_month', 'AdminConfig', `${month.year}-${month.month}`);
    
    // Persist changes to server
    this.api.post('admin/config/release', month).subscribe({
      next: () => this.logger.info('Successfully updated released month on backend.'),
      error: (err) => this.logger.error('Failed to sync released month configurations', err)
    });
  }

  /**
   * Updates global working hour limits.
   */
  public updateWorkingHours(hours: WorkingHours): void {
    this._workingHours.set(hours);
    this.logger.trackEvent('update_working_hours', 'AdminConfig', `${hours.startTime}-${hours.endTime}`);
    
    this.api.post('admin/config/working-hours', hours).subscribe({
      next: () => this.logger.info('Successfully updated working hours limits.'),
      error: (err) => this.logger.error('Failed to sync working hours limits', err)
    });
  }

  /**
   * Updates minimum interval parameters.
   */
  public updateMinAircraftInterval(minutes: number): void {
    this._minAircraftInterval.set(minutes);
    this.logger.trackEvent('update_aircraft_interval', 'AdminConfig', `${minutes}m`);
    
    this.api.post('admin/config/intervals', { minutes }).subscribe({
      next: () => this.logger.info('Successfully updated aircraft intervals.'),
      error: (err) => this.logger.error('Failed to sync aircraft intervals', err)
    });
  }

  /**
   * Updates default durations configurations.
   */
  public updateDefaultDurations(briefing: number, debriefing: number, mission: number): void {
    this._defaultBriefing.set(briefing);
    this._defaultDebriefing.set(debriefing);
    this._defaultMission.set(mission);
    this.syncDefaultDurations();
    
    this.logger.trackEvent('update_durations', 'AdminConfig', `B:${briefing}/D:${debriefing}/M:${mission}`);
  }

  private syncDefaultDurations(): void {
    this.api.post('admin/config/durations', {
      briefing: this._defaultBriefing(),
      debriefing: this._defaultDebriefing(),
      mission: this._defaultMission()
    }).subscribe({
      next: () => this.logger.info('Successfully updated default durations.'),
      error: (err) => this.logger.error('Failed to sync default durations configurations', err)
    });
  }

  private fetchServerConfig(): void {
    // Attempt to pull latest configs from backend
    this.api.get<any>('admin/config').subscribe({
      next: (config) => {
        if (config) {
          if (config.releasedMonth) this._releasedMonth.set(config.releasedMonth);
          if (config.workingHours) this._workingHours.set(config.workingHours);
          if (config.minAircraftInterval) this._minAircraftInterval.set(config.minAircraftInterval);
          if (config.defaultBriefing) this._defaultBriefing.set(config.defaultBriefing);
          if (config.defaultDebriefing) this._defaultDebriefing.set(config.defaultDebriefing);
          if (config.defaultMission) this._defaultMission.set(config.defaultMission);
        }
      },
      error: (err) => {
        this.logger.warn('Failed to retrieve configurations from server. Using default memory state.', err);
      }
    });
  }
}
