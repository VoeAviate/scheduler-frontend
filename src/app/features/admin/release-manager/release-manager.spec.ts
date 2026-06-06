import { TestBed } from '@angular/core/testing';
import { ReleaseManagerComponent } from './release-manager';
import { AdminConfigService } from '../../../data/services/admin-config.service';
import { LoggerService } from '../../../core/logging/logger.service';
import { signal } from '@angular/core';

describe('ReleaseManagerComponent', () => {
  let component: ReleaseManagerComponent;
  let configServiceSpy: any;
  let loggerSpy: any;

  beforeEach(() => {
    configServiceSpy = {
      releasedMonth: signal({ year: 2026, month: 7 }),
      updateReleasedMonth: vi.fn()
    };

    loggerSpy = {
      trackEvent: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [ReleaseManagerComponent],
      providers: [
        { provide: AdminConfigService, useValue: configServiceSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    const fixture = TestBed.createComponent(ReleaseManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should handle month select change', () => {
    const event = { target: { value: '10' } } as any;
    component['onMonthChange'](event);
    expect(component['selectedMonth']()).toBe(10);
  });

  it('should handle year select change', () => {
    const event = { target: { value: '2027' } } as any;
    component['onYearChange'](event);
    expect(component['selectedYear']()).toBe(2027);
  });

  it('should trigger release month on button click and reset states', () => {
    vi.useFakeTimers();
    component['selectedMonth'].set(9);
    component['selectedYear'].set(2026);

    component['onReleaseMonth']();
    expect(component['isReleasing']()).toBe(true);
    expect(component['isReleaseSuccess']()).toBe(false);

    // Advance 1200ms for simulated API
    vi.advanceTimersByTime(1200);

    expect(configServiceSpy.updateReleasedMonth).toHaveBeenCalledWith({
      year: 2026,
      month: 9
    });
    expect(component['isReleasing']()).toBe(false);
    expect(component['isReleaseSuccess']()).toBe(true);
    expect(loggerSpy.trackEvent).toHaveBeenCalledWith('release_new_month', 'AdminDashboard', '2026-9');

    // Advance 3000ms to clear success alert
    vi.advanceTimersByTime(3000);
    expect(component['isReleaseSuccess']()).toBe(false);

    vi.useRealTimers();
  });
});
