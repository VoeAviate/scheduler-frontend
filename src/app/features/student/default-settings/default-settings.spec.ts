import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { DefaultAvailabilityComponent } from './default-settings';
import { StudentAvailabilityService } from '../../../data/services/student-availability.service';
import { AdminConfigService } from '../../../data/services/admin-config.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { signal, computed } from '@angular/core';
import { EN_STRINGS, PT_STRINGS } from '../../../core/date-time/translations';

describe('DefaultAvailabilityComponent', () => {
  let component: DefaultAvailabilityComponent;
  let fixture: any;
  let availabilityServiceSpy: any;
  let adminConfigSpy: any;
  let dateTimeServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    availabilityServiceSpy = {
      defaultWeeklyTemplate: signal([]),
      saveDefaultTemplate: vi.fn()
    };

    adminConfigSpy = {
      workingHours: signal({ startTime: '08:00', endTime: '18:00' })
    };

    dateTimeServiceSpy = {
      locale: signal('en-US'),
      translations: signal(EN_STRINGS)
    };

    TestBed.configureTestingModule({
      imports: [DefaultAvailabilityComponent],
      providers: [
        provideRouter([]),
        { provide: StudentAvailabilityService, useValue: availabilityServiceSpy },
        { provide: AdminConfigService, useValue: adminConfigSpy },
        { provide: DateTimeService, useValue: dateTimeServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(DefaultAvailabilityComponent);
    component = fixture.componentInstance;
    routerSpy = TestBed.inject(Router);
    vi.spyOn(routerSpy, 'navigate').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize dayNames based on locale', () => {
    let dayNames = component.dayNames();
    expect(dayNames[0]).toBe('Sun');

    dateTimeServiceSpy.locale.set('pt-BR');
    fixture.detectChanges();
    dayNames = component.dayNames();
    expect(dayNames[0]).toBe('Dom');
  });

  it('should toggle local slots onMouseDown and drag select/deselect', () => {
    const event = { preventDefault: vi.fn() } as any;

    // Test select
    component['onMouseDown'](1, '09:00', event);
    expect(component['templateSelections']().length).toBe(1);
    expect(component['templateSelections']()[0]).toEqual({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00'
    });

    // Test drag select on enter
    component['onMouseEnter'](1, '10:00');
    expect(component['templateSelections']().length).toBe(2);

    // Test drag deselect: release click, click on existing slot to deselect
    component['onMouseUp']();
    component['onMouseDown'](1, '09:00', event);
    expect(component['templateSelections']().length).toBe(1);
    expect(component['templateSelections']()[0].startTime).toBe('10:00');
  });

  it('should save template and navigate back', () => {
    vi.useFakeTimers();
    component['onSaveTemplate']();
    expect(availabilityServiceSpy.saveDefaultTemplate).toHaveBeenCalled();
    expect(component['isSavedSuccess']()).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(component['isSavedSuccess']()).toBe(false);
    vi.useRealTimers();

    component['onBackToCalendar']();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/student']);
  });
});
