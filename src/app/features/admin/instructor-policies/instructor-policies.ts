import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateTimeService } from '../../../core/date-time/date-time.service';

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
  protected readonly dateTime = inject(DateTimeService);

  // Private mock instructors data
  private readonly _instructors = signal<InstructorPolicy[]>([
    { id: 1, name: 'Capt. Richard Vance', policyType: 'Weekly Regulatory Rest', status: 'COMPLIANT', details: 'Has 36 consecutive hours off scheduled (Sunday 18:00 - Tuesday 06:00).' },
    { id: 2, name: 'Capt. Gabriel Silva', policyType: 'Weekly Regulatory Rest', status: 'VIOLATION', details: 'Scheduled flights on all 7 days of the active week. Missing 24h rest.' },
    { id: 3, name: 'Capt. Clara Mercer', policyType: 'Max Daily Instruction', status: 'COMPLIANT', details: 'Under max 8 hours daily flight time instruction limit (current max: 6.5h).' },
    { id: 4, name: 'Capt. Thomas Miller', policyType: 'Weekly Regulatory Rest', status: 'COMPLIANT', details: 'Has 48 consecutive hours off scheduled (Thursday 08:00 - Saturday 08:00).' }
  ]);

  // Compute translated fields (policyType, status, details) dynamically
  public readonly instructors = computed(() => {
    const list = this._instructors();
    const t = this.dateTime.translations();
    
    return list.map(ins => {
      let policyTypeTranslated = ins.policyType;
      let detailsTranslated = ins.details;
      
      // Translate policy types
      if (ins.policyType.includes('Rest') || ins.policyType.includes('Descanso')) policyTypeTranslated = t.weeklyRest;
      else if (ins.policyType.includes('Instruction') || ins.policyType.includes('Instrução')) policyTypeTranslated = t.maxDaily;

      // Translate details
      if (ins.details.includes('36 consecutive') || ins.details.includes('36 horas')) detailsTranslated = t.vanceDetails;
      else if (ins.details.includes('all 7 days') || ins.details.includes('todos os 7')) detailsTranslated = t.silvaDetails;
      else if (ins.details.includes('Under max 8') || ins.details.includes('Abaixo do limite')) detailsTranslated = t.mercerDetails;
      else if (ins.details.includes('48 consecutive') || ins.details.includes('48 horas')) detailsTranslated = t.millerDetails;
      else if (ins.details.includes('overridden') || ins.details.includes('desconsiderada')) detailsTranslated = t.violationOverridden;

      return {
        ...ins,
        policyType: policyTypeTranslated,
        details: detailsTranslated
      };
    });
  });

  protected onAcknowledgeViolation(instructorId: number): void {
    this._instructors.update(list => 
      list.map(ins => ins.id === instructorId ? { ...ins, status: 'COMPLIANT', details: 'Violation overridden/scheduled rest assigned.' } : ins)
    );
  }
}
