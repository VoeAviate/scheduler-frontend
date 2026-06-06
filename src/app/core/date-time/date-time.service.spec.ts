import { TestBed } from '@angular/core/testing';
import { DateTimeService } from './date-time.service';

describe('DateTimeService', () => {
  let service: DateTimeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [DateTimeService]
    });
    service = TestBed.inject(DateTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect browser locale by default if no localStorage cached', () => {
    expect(service.locale()).toBeDefined();
  });

  it('should store and retrieve language settings from localStorage', () => {
    service.setLocale('pt-BR');
    expect(service.locale()).toBe('pt-BR');
    expect(localStorage.getItem('user_language')).toBe('pt-BR');
  });

  it('should format ISO string to localized representation', () => {
    service.setLocale('en-US');
    const isoString = '2026-07-01T10:00:00Z';
    // Format to short month + day
    const result = service.formatToLocale(isoString, { month: 'short', day: '2-digit', timeZone: 'UTC' });
    expect(result).toContain('Jul');
    expect(result).toContain('01');
  });

  it('should combine local day and time into a UTC ISO string', () => {
    const day = '2026-07-01';
    const time = '12:00';
    // Combining 12:00 in local timezone should result in an ISO string
    const result = service.combineToUtcIso(day, time);
    expect(result).toContain('2026-07-01T');
    expect(result.endsWith('Z')).toBe(true);
  });

  it('should add hours to date objects correctly', () => {
    const base = new Date('2026-07-01T12:00:00Z');
    const next = service.addHours(base, 3);
    expect(next.getUTCHours()).toBe(15);
  });

  it('should add days to date objects correctly', () => {
    const base = new Date('2026-07-01T12:00:00Z');
    const next = service.addDays(base, 2);
    expect(next.getUTCDate()).toBe(3);
  });

  it('should calculate difference in hours between two dates', () => {
    const start = '2026-07-01T12:00:00Z';
    const end = '2026-07-01T15:30:00Z';
    const diff = service.getDifferenceInHours(start, end);
    expect(diff).toBe(3.5);
  });

  it('should format Date objects to YYYY-MM-DD string', () => {
    const date = new Date(2026, 6, 15); // July 15, 2026
    const result = service.formatToIsoDate(date);
    expect(result).toBe('2026-07-15');
  });

  it('should return empty string if formatToLocale fails', () => {
    const result = service.formatToLocale('invalid-iso-date', {});
    expect(result).toBe('');
  });

  it('should load initial locale from localStorage on bootstrap', () => {
    localStorage.setItem('user_language', 'pt-BR');
    const newService = new DateTimeService();
    expect(newService.locale()).toBe('pt-BR');
  });

  it('should detect browser pt language preference on bootstrap', () => {
    vi.stubGlobal('navigator', { language: 'pt-PT' });
    
    const newService = new DateTimeService();
    expect(newService.locale()).toBe('pt-BR');

    vi.unstubAllGlobals();
  });
});
