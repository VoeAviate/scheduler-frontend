import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminConfigService } from '../../../data/services/admin-config.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';

@Component({
  selector: 'aviate-config-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-panel.html',
  styleUrl: './config-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigPanelComponent {
  protected readonly configService = inject(AdminConfigService);
  protected readonly dateTime = inject(DateTimeService);

  // Writable signal tracking local forms changes
  protected readonly isSaving = signal<boolean>(false);
  protected readonly isSaveSuccess = signal<boolean>(false);

  // Form bounds
  protected startHour = '06:00';
  protected endHour = '21:00';
  protected minInterval = 30;
  protected briefingTime = 30;
  protected debriefingTime = 30;
  protected missionTime = 90;

  constructor() {
    // Sync initial states from global signals
    const working = this.configService.workingHours();
    this.startHour = working.startTime;
    this.endHour = working.endTime;
    this.minInterval = this.configService.minAircraftInterval();
    this.briefingTime = this.configService.defaultBriefing();
    this.debriefingTime = this.configService.defaultDebriefing();
    this.missionTime = this.configService.defaultMission();
  }

  protected onSaveConfig(): void {
    this.isSaving.set(true);
    this.isSaveSuccess.set(false);

    // Mock API configurations sync
    setTimeout(() => {
      // 1. Save Working Hours
      this.configService.updateWorkingHours({
        startTime: this.startHour,
        endTime: this.endHour
      });

      // 2. Save Interval
      this.configService.updateMinAircraftInterval(this.minInterval);

      // 3. Save Durations
      this.configService.updateDefaultDurations(
        this.briefingTime,
        this.debriefingTime,
        this.missionTime
      );

      this.isSaving.set(false);
      this.isSaveSuccess.set(true);

      setTimeout(() => {
        this.isSaveSuccess.set(false);
      }, 3000);
    }, 1000);
  }
}
