import { TestBed } from '@angular/core/testing';
import { StudentScheduleComponent } from './schedule';
import { StudentAvailabilityService } from '../../../data/services/student-availability.service';
import { AdminConfigService } from '../../../data/services/admin-config.service';
import { AuthService } from '../../../core/auth/auth.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { signal } from '@angular/core';
import { UserType } from '../../../data/models/user.model';

describe('StudentScheduleComponent', () => {
  let availabilityServiceSpy: any;
  let adminConfigSpy: any;
  let authServiceSpy: any;

  beforeEach(() => {
    availabilityServiceSpy = {
      selections: signal([]),
      defaultWeeklyTemplate: signal([]),
      isSubmitting: signal(false),
      isSubmitSuccess: signal(false),
      totalSelectedHours: signal(0),
      addSlot: vi.fn(),
      removeSlot: vi.fn()
    };

    adminConfigSpy = {
      releasedMonth: signal({ year: 2026, month: 7 }),
      workingHours: signal({ startTime: '08:00', endTime: '18:00' })
    };

    authServiceSpy = {
      currentUser: signal({
        userId: 101,
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserType.Student,
        fboId: 1,
        email: 'jane.doe@example.com',
        timezone: 'America/New_York',
        trainingProgram: { id: 'PPL', name: 'Private Pilot License' }
      })
    };

    TestBed.configureTestingModule({
      imports: [StudentScheduleComponent],
      providers: [
        DateTimeService,
        { provide: StudentAvailabilityService, useValue: availabilityServiceSpy },
        { provide: AdminConfigService, useValue: adminConfigSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(StudentScheduleComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
