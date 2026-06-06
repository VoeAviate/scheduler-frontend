import { TestBed } from '@angular/core/testing';
import { StatusTrackerComponent } from './status-tracker';

describe('StatusTrackerComponent', () => {
  let component: StatusTrackerComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StatusTrackerComponent]
    });

    const fixture = TestBed.createComponent(StatusTrackerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial pending students', () => {
    const students = component['pendingStudents']();
    expect(students.length).toBe(4);
    expect(students[0].reminderSent).toBe(false);
  });

  it('should toggle reminderSent when onSendReminder is called', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    
    component['onSendReminder'](1);
    const students = component['pendingStudents']();
    expect(students[0].reminderSent).toBe(true);
    expect(students[1].reminderSent).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Mock notification dispatched to student ID: 1');

    consoleSpy.mockRestore();
  });
});
