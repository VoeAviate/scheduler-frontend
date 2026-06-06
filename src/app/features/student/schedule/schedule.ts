import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../calendar/calendar';
import { AvailabilitySummaryComponent } from '../summary/summary';

@Component({
  selector: 'aviate-student-schedule',
  standalone: true,
  imports: [CommonModule, CalendarComponent, AvailabilitySummaryComponent],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentScheduleComponent {}
