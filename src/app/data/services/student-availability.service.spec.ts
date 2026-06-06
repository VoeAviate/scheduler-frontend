import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StudentAvailabilityService } from './student-availability.service';
import { AdminConfigService } from './admin-config.service';
import { ApiService } from '../../core/api/api.service';
import { LoggerService } from '../../core/logging/logger.service';
import { DateTimeService } from '../../core/date-time/date-time.service';

describe('StudentAvailabilityService', () => {
  let service: StudentAvailabilityService;
  let adminConfig: AdminConfigService;
  let apiSpy: any;

  beforeEach(() => {
    localStorage.clear();

    apiSpy = {
      get: vi.fn().mockReturnValue(of({})),
      post: vi.fn().mockReturnValue(of({ success: true }))
    };

    TestBed.configureTestingModule({
      providers: [
        StudentAvailabilityService,
        AdminConfigService,
        DateTimeService,
        LoggerService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(StudentAvailabilityService);
    adminConfig = TestBed.inject(AdminConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add slots and sync with localStorage cache', () => {
    const slot = { day: '2026-07-01', startTime: '08:00', endTime: '09:00' };
    service.addSlot(slot);

    expect(service.selections()).toContainEqual(slot);
    const cached = JSON.parse(localStorage.getItem('aviate_availability_draft') || '[]');
    expect(cached).toContainEqual(slot);
  });

  it('should remove slots and update cache', () => {
    const slot1 = { day: '2026-07-01', startTime: '08:00', endTime: '09:00' };
    const slot2 = { day: '2026-07-01', startTime: '10:00', endTime: '11:00' };
    service.addSlot(slot1);
    service.addSlot(slot2);
    
    service.removeSlot(slot1);

    expect(service.selections()).not.toContainEqual(slot1);
    expect(service.selections()).toContainEqual(slot2);
  });

  it('should save default weekly template', () => {
    const template = [
      { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 3, startTime: '13:00', endTime: '17:00' }
    ];
    service.saveDefaultTemplate(template);

    expect(service.defaultWeeklyTemplate()).toEqual(template);
    const cached = JSON.parse(localStorage.getItem('aviate_weekly_template') || '[]');
    expect(cached).toEqual(template);
  });

  it('should apply default template to the currently displayed week', () => {
    // July 2026 released month contains 31 days
    // Mondays are dayOfWeek = 1
    // July 2026 has Mondays on 6th, 13th, 20th, 27th
    adminConfig.updateReleasedMonth({ year: 2026, month: 7 });

    const template = [{ dayOfWeek: 1, startTime: '08:00', endTime: '09:00' }];
    service.saveDefaultTemplate(template);

    // Set active week to start on Sunday July 5th, 2026
    service.currentWeekStart.set(new Date(2026, 6, 5));
    service.applyDefaultAvailability();

    let selections = service.selections();
    expect(selections.length).toBe(1); // Only Monday July 6th in this week
    expect(selections[0]).toEqual({ day: '2026-07-06', startTime: '08:00', endTime: '09:00' });

    // Navigate to next week starting Sunday July 12th, 2026
    service.currentWeekStart.set(new Date(2026, 6, 12));
    service.applyDefaultAvailability();

    selections = service.selections();
    // Should accumulate and contain both Monday July 6th and Monday July 13th
    expect(selections.length).toBe(2);
    expect(selections).toContainEqual({ day: '2026-07-06', startTime: '08:00', endTime: '09:00' });
    expect(selections).toContainEqual({ day: '2026-07-13', startTime: '08:00', endTime: '09:00' });
  });

  it('should clear availability slots for the currently displayed week', () => {
    adminConfig.updateReleasedMonth({ year: 2026, month: 7 });

    const slotWeek1 = { day: '2026-07-06', startTime: '08:00', endTime: '09:00' };
    const slotWeek2 = { day: '2026-07-13', startTime: '08:00', endTime: '09:00' };
    
    service.addSlot(slotWeek1);
    service.addSlot(slotWeek2);

    expect(service.selections().length).toBe(2);

    // Set active week to start on Sunday July 5th, 2026 (covers July 6th)
    service.currentWeekStart.set(new Date(2026, 6, 5));
    service.clearWeeklyAvailability();

    expect(service.selections().length).toBe(1);
    expect(service.selections()).toContainEqual(slotWeek2);
    expect(service.selections()).not.toContainEqual(slotWeek1);
  });

  it('should confirm availability selections, clear cache on success', () => {
    const slot = { day: '2026-07-01', startTime: '08:00', endTime: '09:00' };
    service.addSlot(slot);

    service.confirmAvailability(101);

    expect(apiSpy.post).toHaveBeenCalledWith('student/availability/101', { slots: [slot] });
    expect(service.isSubmitSuccess()).toBe(true);
    expect(service.selections().length).toBe(0);
    expect(localStorage.getItem('aviate_availability_draft')).toBeNull();
  });

  it('should retain selections in cache if backend submission fails', () => {
    const slot = { day: '2026-07-01', startTime: '08:00', endTime: '09:00' };
    service.addSlot(slot);
    apiSpy.post.mockReturnValue(throwError(() => new Error('API Error')));

    service.confirmAvailability(101);

    expect(service.isSubmitSuccess()).toBe(false);
    expect(service.selections()).toContainEqual(slot);
    expect(localStorage.getItem('aviate_availability_draft')).not.toBeNull();
  });

  it('should calculate totalSelectedHours and handle invalid slot durations', () => {
    // Valid slots
    service.addSlot({ day: '2026-07-01', startTime: '08:00', endTime: '10:00' });
    service.addSlot({ day: '2026-07-01', startTime: '12:00', endTime: '13:30' });
    expect(service.totalSelectedHours()).toBe(3.5);

    // Invalid slot format triggering catch block
    service.addSlot({ day: 'invalid-day', startTime: 'xx:xx', endTime: 'yy:yy' });
    // Duration should return 0 for the invalid slot, total is still 3.5
    expect(service.totalSelectedHours()).toBe(3.5);
  });

  it('should reset submit success state', () => {
    service.resetSubmitSuccess();
    expect(service.isSubmitSuccess()).toBe(false);
  });

  it('should handle edge cases for applying default template', () => {
    const logger = TestBed.inject(LoggerService);
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    // Case 1: Template is empty
    const adminConfigSpy = TestBed.inject(AdminConfigService);
    vi.spyOn(adminConfigSpy, 'releasedMonth').mockReturnValue({ year: 2026, month: 7 });
    service.applyDefaultAvailability();
    expect(warnSpy).toHaveBeenCalledWith('Cannot apply default template: Template is empty.');

    // Case 2: Released month is null
    warnSpy.mockClear();
    vi.spyOn(adminConfigSpy, 'releasedMonth').mockReturnValue(null);
    service.saveDefaultTemplate([{ dayOfWeek: 1, startTime: '08:00', endTime: '09:00' }]);
    service.applyDefaultAvailability();
    expect(warnSpy).toHaveBeenCalledWith('Cannot apply default template: No released month found.');

    warnSpy.mockRestore();
  });

  it('should prevent submission when selections are empty', () => {
    const logger = TestBed.inject(LoggerService);
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    service.confirmAvailability(101);
    expect(warnSpy).toHaveBeenCalledWith('Cannot submit: Selections are empty.');
    expect(apiSpy.post).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should handle cache parsing errors gracefully', () => {
    const errorSpy = vi.spyOn(LoggerService.prototype, 'error').mockImplementation(() => {});

    localStorage.setItem('aviate_availability_draft', 'invalid-json');
    localStorage.setItem('aviate_weekly_template', 'invalid-json');

    // Reconfigure and recreate service to trigger constructor loading
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        StudentAvailabilityService,
        AdminConfigService,
        DateTimeService,
        LoggerService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    const newService = TestBed.inject(StudentAvailabilityService);
    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(newService.selections().length).toBe(0);
    expect(newService.defaultWeeklyTemplate().length).toBe(0);

    errorSpy.mockRestore();
  });
});
