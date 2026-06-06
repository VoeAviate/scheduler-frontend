import { TestBed } from '@angular/core/testing';
import { AdminDashboardComponent } from './dashboard';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminConfigService } from '../../../data/services/admin-config.service';
import { LoggerService } from '../../../core/logging/logger.service';
import { signal } from '@angular/core';

describe('AdminDashboardComponent', () => {
  let authServiceSpy: any;
  let adminConfigSpy: any;
  let loggerSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      currentUser: signal({
        userId: 102,
        firstName: 'Alex',
        lastName: 'Smith',
        role: 'ADMINISTRATOR'
      })
    };

    adminConfigSpy = {
      releasedMonth: signal({ year: 2026, month: 7 }),
      workingHours: signal({ startTime: '08:00', endTime: '18:00' }),
      minAircraftInterval: signal(60),
      defaultBriefing: signal(20),
      defaultDebriefing: signal(20),
      defaultMission: signal(120),
      updateWorkingHours: vi.fn(),
      updateMinAircraftInterval: vi.fn(),
      updateDefaultDurations: vi.fn(),
      updateReleasedMonth: vi.fn()
    };

    loggerSpy = {
      trackEvent: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AdminConfigService, useValue: adminConfigSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
