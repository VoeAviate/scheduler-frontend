import { TestBed } from '@angular/core/testing';
import { InstructorPoliciesComponent } from './instructor-policies';

describe('InstructorPoliciesComponent', () => {
  let component: InstructorPoliciesComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InstructorPoliciesComponent]
    });

    const fixture = TestBed.createComponent(InstructorPoliciesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should list policies correctly', () => {
    const list = component['instructors']();
    expect(list.length).toBe(4);
    expect(list[1].status).toBe('VIOLATION');
  });

  it('should override status onAcknowledgeViolation', () => {
    component['onAcknowledgeViolation'](2);
    const list = component['instructors']();
    expect(list[1].status).toBe('COMPLIANT');
    expect(list[1].details).toContain('Violation overridden');
  });
});
