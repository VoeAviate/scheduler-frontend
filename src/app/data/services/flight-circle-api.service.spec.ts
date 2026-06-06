import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FlightCircleApiService } from './flight-circle-api.service';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { LoggerService } from '../../core/logging/logger.service';

describe('FlightCircleApiService', () => {
  let service: FlightCircleApiService;
  let authService: AuthService;
  let apiSpy: any;

  beforeEach(() => {
    localStorage.clear();
    apiSpy = {
      get: vi.fn().mockReturnValue(of([]))
    };

    TestBed.configureTestingModule({
      providers: [
        FlightCircleApiService,
        AuthService,
        LoggerService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(FlightCircleApiService);
    authService = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fallback to FboID = 1 if user is not authenticated', () => {
    expect(service.currentFboId()).toBe(1);
  });

  it('should resolve the correct FboID from the user profile when authenticated', () => {
    authService.setMockSession('STUDENT'); // Jane Doe has FboID = 1
    expect(service.currentFboId()).toBe(1);
  });

  it('should call getAircrafts with the correct FboID path parameter', () => {
    service.getAircrafts().subscribe();
    expect(apiSpy.get).toHaveBeenCalledWith('aircraft/1');
  });

  it('should call getInstructors with the correct FboID path parameter', () => {
    service.getInstructors().subscribe();
    expect(apiSpy.get).toHaveBeenCalledWith('instructors/1');
  });

  it('should call getSchedules with the correct time bounds', () => {
    const start = { year: 2026, month: 7, day: 1 };
    const end = { year: 2026, month: 7, day: 7 };
    service.getSchedules('all', start, end).subscribe();

    expect(apiSpy.get).toHaveBeenCalledWith('schedules/1/all/2026/7/1/2026/7/7');
  });

  it('should call getStudentSchedules with correct user and time ranges', () => {
    const start = { year: 2026, month: 7, day: 15 };
    const end = { year: 2026, month: 7, day: 20 };
    service.getStudentSchedules(101, start, end).subscribe();

    expect(apiSpy.get).toHaveBeenCalledWith('user/schedules/1/101/2026/7/15/2026/7/20');
  });
});
