import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { ReleaseManagerComponent } from '../release-manager/release-manager';
import { ConfigPanelComponent } from '../config-panel/config-panel';
import { StatusTrackerComponent } from '../status-tracker/status-tracker';

@Component({
  selector: 'aviate-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReleaseManagerComponent,
    ConfigPanelComponent,
    StatusTrackerComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  protected readonly auth = inject(AuthService);
  protected readonly dateTime = inject(DateTimeService);
}
