import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface InstructorPolicy {
  id: number;
  name: string;
  policyType: string;
  status: 'COMPLIANT' | 'VIOLATION';
  details: string;
}

@Component({
  selector: 'aviate-instructor-policies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-policies.html',
  styleUrl: './instructor-policies.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstructorPoliciesComponent {
  // Mock instructors data
  protected readonly instructors = signal<InstructorPolicy[]>([
    { id: 1, name: 'Capt. Richard Vance', policyType: 'Weekly Regulatory Rest', status: 'COMPLIANT', details: 'Has 36 consecutive hours off scheduled (Sunday 18:00 - Tuesday 06:00).' },
    { id: 2, name: 'Capt. Gabriel Silva', policyType: 'Weekly Regulatory Rest', status: 'VIOLATION', details: 'Scheduled flights on all 7 days of the active week. Missing 24h rest.' },
    { id: 3, name: 'Capt. Clara Mercer', policyType: 'Max Daily Instruction', status: 'COMPLIANT', details: 'Under max 8 hours daily flight time instruction limit (current max: 6.5h).' },
    { id: 4, name: 'Capt. Thomas Miller', policyType: 'Weekly Regulatory Rest', status: 'COMPLIANT', details: 'Has 48 consecutive hours off scheduled (Thursday 08:00 - Saturday 08:00).' }
  ]);

  protected onAcknowledgeViolation(instructorId: number): void {
    this.instructors.update(list => 
      list.map(ins => ins.id === instructorId ? { ...ins, status: 'COMPLIANT', details: 'Violation overridden/scheduled rest assigned.' } : ins)
    );
  }
}
