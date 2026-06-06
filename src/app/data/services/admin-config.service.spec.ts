import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminConfigService } from './admin-config.service';
import { ApiService } from '../../core/api/api.service';
import { LoggerService } from '../../core/logging/logger.service';

describe('AdminConfigService', () => {
  let service: AdminConfigService;
  let apiSpy: any;

  beforeEach(() => {
    apiSpy = {
      get: vi.fn().mockReturnValue(of({
        releasedMonth: { year: 2026, month: 8 },
        workingHours: { startTime: '07:00', endTime: '22:00' },
        minAircraftInterval: 45,
        defaultBriefing: 15,
        defaultDebriefing: 15,
        defaultMission: 60
      })),
      post: vi.fn().mockReturnValue(of({ success: true }))
    };

    TestBed.configureTestingModule({
      providers: [
        AdminConfigService,
        LoggerService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(AdminConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should pull configuration values on initialization', () => {
    expect(apiSpy.get).toHaveBeenCalledWith('admin/config');
    expect(service.releasedMonth()).toEqual({ year: 2026, month: 8 });
    expect(service.workingHours()).toEqual({ startTime: '07:00', endTime: '22:00' });
    expect(service.minAircraftInterval()).toBe(45);
    expect(service.defaultBriefing()).toBe(15);
    expect(service.defaultMission()).toBe(60);
  });

  it('should update released month and post updates to server', () => {
    service.updateReleasedMonth({ year: 2027, month: 1 });
    expect(service.releasedMonth()).toEqual({ year: 2027, month: 1 });
    expect(apiSpy.post).toHaveBeenCalledWith('admin/config/release', { year: 2027, month: 1 });
  });

  it('should update working hours limits and post updates to server', () => {
    const hours = { startTime: '08:00', endTime: '18:00' };
    service.updateWorkingHours(hours);
    expect(service.workingHours()).toEqual(hours);
    expect(apiSpy.post).toHaveBeenCalledWith('admin/config/working-hours', hours);
  });

  it('should update aircraft interval and post updates to server', () => {
    service.updateMinAircraftInterval(60);
    expect(service.minAircraftInterval()).toBe(60);
    expect(apiSpy.post).toHaveBeenCalledWith('admin/config/intervals', { minutes: 60 });
  });

  it('should update default durations and post updates to server', () => {
    service.updateDefaultDurations(20, 20, 120);
    expect(service.defaultBriefing()).toBe(20);
    expect(service.defaultDebriefing()).toBe(20);
    expect(service.defaultMission()).toBe(120);
    expect(apiSpy.post).toHaveBeenCalledWith('admin/config/durations', {
      briefing: 20,
      debriefing: 20,
      mission: 120
    });
  });

  describe('Error handling', () => {
    it('should handle API errors during initialization/fetching config', () => {
      const errorApiSpy = {
        get: vi.fn().mockReturnValue(throwError(() => new Error('API Error'))),
        post: vi.fn()
      };
      
      const warnSpy = vi.spyOn(LoggerService.prototype, 'warn').mockImplementation(() => {});

      // Recreate to test error path on init
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AdminConfigService,
          LoggerService,
          { provide: ApiService, useValue: errorApiSpy }
        ]
      });
      const testService = TestBed.inject(AdminConfigService);
      
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should handle API errors during updates', () => {
      const loggerSpy = TestBed.inject(LoggerService);
      const errorSpy = vi.spyOn(loggerSpy, 'error').mockImplementation(() => {});
      apiSpy.post.mockReturnValue(throwError(() => new Error('Sync Error')));

      service.updateReleasedMonth({ year: 2026, month: 12 });
      service.updateWorkingHours({ startTime: '09:00', endTime: '17:00' });
      service.updateMinAircraftInterval(15);
      service.updateDefaultDurations(10, 10, 30);

      expect(errorSpy).toHaveBeenCalledTimes(4);
      errorSpy.mockRestore();
    });
  });
});
