import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateTimeService } from '../../../core/date-time/date-time.service';

export interface PendingStudent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  program: string;
  reminderSent: boolean;
}

@Component({
  selector: 'aviate-status-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-tracker.html',
  styleUrl: './status-tracker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusTrackerComponent {
  protected readonly dateTime = inject(DateTimeService);

  // Mock students database state
  private readonly _pendingStudents = signal<PendingStudent[]>([
    { id: 1, firstName: 'Marcus', lastName: 'Vance', email: 'marcus.vance@aviate.com', program: 'Commercial Pilot License (CPL)', reminderSent: false },
    { id: 2, firstName: 'Sophia', lastName: 'Gomez', email: 'sophia.gomez@aviate.com', program: 'Private Pilot License (PPL)', reminderSent: false },
    { id: 3, firstName: 'Liam', lastName: 'O\'Connor', email: 'liam.oconnor@aviate.com', program: 'Instrument Rating (IR)', reminderSent: false },
    { id: 4, firstName: 'Emilia', lastName: 'Tanaka', email: 'emilia.tanaka@aviate.com', program: 'Multi-Engine Rating (ME)', reminderSent: false }
  ]);

  // Compute translated student programs
  public readonly pendingStudents = computed(() => {
    const list = this._pendingStudents();
    const t = this.dateTime.translations();
    
    return list.map(student => {
      let programTranslated = student.program;
      if (student.program.includes('Commercial')) programTranslated = t.cpl;
      else if (student.program.includes('Private')) programTranslated = t.ppl;
      else if (student.program.includes('Instrument')) programTranslated = t.ir;
      else if (student.program.includes('Multi')) programTranslated = t.me;

      return {
        ...student,
        program: programTranslated
      };
    });
  });

  protected onSendReminder(studentId: number): void {
    this._pendingStudents.update(students => 
      students.map(s => s.id === studentId ? { ...s, reminderSent: true } : s)
    );

    // Mock API trigger tracking
    console.info(`Mock notification dispatched to student ID: ${studentId}`);
  }
}
