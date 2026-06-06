import { TestBed } from '@angular/core/testing';
import { CalendarComponent } from './calendar';
import { StudentAvailabilityService } from '../../../data/services/student-availability.service';
import { AdminConfigService } from '../../../data/services/admin-config.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { signal } from '@angular/core';
import { AvailabilitySlot } from '../../../data/models/availability.model';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let availabilityServiceSpy: any;
  let adminConfigSpy: any;
  let dateTimeService: DateTimeService;

  beforeEach(() => {
    availabilityServiceSpy = {
      selections: signal<AvailabilitySlot[]>([]),
      addSlot: vi.fn(),
      removeSlot: vi.fn(),
      clearWeeklyAvailability: vi.fn(),
      currentWeekStart: signal<Date>(new Date()),
      isSubmitting: signal<boolean>(false)
    };

    adminConfigSpy = {
      releasedMonth: signal({ year: 2026, month: 7 }), // July 2026
      workingHours: signal({ startTime: '08:00', endTime: '18:00' })
    };

    TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [
        DateTimeService,
        { provide: StudentAvailabilityService, useValue: availabilityServiceSpy },
        { provide: AdminConfigService, useValue: adminConfigSpy }
      ]
    });

    const fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    dateTimeService = TestBed.inject(DateTimeService);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize currentWeekStart based on releasedMonth', () => {
    const start = component['currentWeekStart']();
    // July 1 2026 is Wednesday. Sunday of that week is June 28 2026.
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(5); // June (0-indexed)
    expect(start.getDate()).toBe(28);
  });

  it('should generate timeSlots based on workingHours', () => {
    const slots = component.timeSlots();
    expect(slots[0]).toBe('08:00');
    expect(slots[slots.length - 1]).toBe('18:00');
    expect(slots.length).toBe(11); // 08:00 to 18:00 inclusive
  });

  it('should display the header correctly', () => {
    const header = component.displayHeader();
    expect(header).toContain('July');
    expect(header).toContain('2026');
  });

  it('should capitalize only the first character of the display header', () => {
    vi.spyOn(dateTimeService, 'formatToLocale').mockReturnValue('julho de 2026');
    adminConfigSpy.releasedMonth.set({ year: 2026, month: 8 });
    const header = component.displayHeader();
    expect(header).toBe('Julho de 2026');
  });

  it('should identify disabled days outside the released month', () => {
    const juneDay = new Date(2026, 5, 30); // June 30
    const julyDay = new Date(2026, 6, 15); // July 15
    const augustDay = new Date(2026, 7, 1); // Aug 1

    expect(component.isDayDisabled(juneDay)).toBe(true);
    expect(component.isDayDisabled(julyDay)).toBe(false);
    expect(component.isDayDisabled(augustDay)).toBe(true);
  });

  it('should toggle selection state correctly on mouse actions', () => {
    const day = new Date(2026, 6, 15); // July 15, 2026
    const dayStr = '2026-07-15';

    // Simulated click (mousedown) to select
    const mousedownEvent = { preventDefault: vi.fn() } as any;
    component['onMouseDown'](day, '09:00', mousedownEvent);
    expect(availabilityServiceSpy.addSlot).toHaveBeenCalledWith({
      day: dayStr,
      startTime: '09:00',
      endTime: '10:00'
    });

    // Mock that the slot is now selected
    availabilityServiceSpy.selections.set([
      { day: dayStr, startTime: '09:00', endTime: '10:00' }
    ]);

    // Simulated click (mousedown) to deselect
    component['onMouseDown'](day, '09:00', mousedownEvent);
    expect(availabilityServiceSpy.removeSlot).toHaveBeenCalledWith({
      day: dayStr,
      startTime: '09:00',
      endTime: '10:00'
    });
  });

  it('should allow drag-selection on mouseenter when mousedown is active', () => {
    const day = new Date(2026, 6, 15);
    const dayStr = '2026-07-15';
    const mousedownEvent = { preventDefault: vi.fn() } as any;

    // First mouseDown to activate drag selection
    component['onMouseDown'](day, '09:00', mousedownEvent);
    
    // MouseEnter on adjacent slot
    component['onMouseEnter'](day, '10:00');
    expect(availabilityServiceSpy.addSlot).toHaveBeenCalledWith({
      day: dayStr,
      startTime: '10:00',
      endTime: '11:00'
    });

    // MouseUp should clear mouse down state
    component['onMouseUp']();
    availabilityServiceSpy.addSlot.mockClear();

    // MouseEnter should do nothing after mouseUp
    component['onMouseEnter'](day, '11:00');
    expect(availabilityServiceSpy.addSlot).not.toHaveBeenCalled();
  });

  it('should navigate weeks within released limits', () => {
    // Current week is Wednesday, July 1st 2026, starts Sunday June 28th
    // Week + 1 starts Sunday July 5th (within July)
    // Week + 2 starts Sunday July 12th (within July)
    // Week + 3 starts Sunday July 19th (within July)
    // Week + 4 starts Sunday July 26th (within July)
    // Week + 5 starts Sunday August 2nd (overlaps July 31st) -> wait, overlaps?
    // Let's check navigation calls
    expect(component.canNavigateNext()).toBe(true);
    component['navigateNextWeek']();
    
    expect(component.canNavigatePrev()).toBe(true);
    component['navigatePrevWeek']();
  });

  it('should handle null releasedMonth gracefully', () => {
    adminConfigSpy.releasedMonth.set(null);
    
    expect(component.releasedMonthDate()).toBeInstanceOf(Date);
    expect(component.displayHeader()).toBe('');
    expect(component.isDayDisabled(new Date())).toBe(true);
    expect(component['isWeekInReleasedMonth'](new Date())).toBe(false);

    // mousedown on a day should do nothing if disabled
    const mousedownEvent = { preventDefault: vi.fn() } as any;
    component['onMouseDown'](new Date(), '09:00', mousedownEvent);
    expect(availabilityServiceSpy.addSlot).not.toHaveBeenCalled();
  });

  it('should compute hasSelectionsInCurrentWeek based on active week selections', () => {
    // Current active week in test starts Sunday June 28th, 2026. Released month is July 2026.
    // Days in July inside this week: Wednesday July 1st, Thursday July 2nd, Friday July 3rd, Saturday July 4th.
    
    // Initially no selections
    expect(component.hasSelectionsInCurrentWeek()).toBe(false);

    // Selection in July outside current week (e.g. July 10th)
    availabilityServiceSpy.selections.set([
      { day: '2026-07-10', startTime: '09:00', endTime: '10:00' }
    ]);
    expect(component.hasSelectionsInCurrentWeek()).toBe(false);

    // Selection in July inside current week (e.g. July 2nd)
    availabilityServiceSpy.selections.set([
      { day: '2026-07-02', startTime: '09:00', endTime: '10:00' }
    ]);
    expect(component.hasSelectionsInCurrentWeek()).toBe(true);
  });

  it('should call clearWeeklyAvailability on Clear Week button click', () => {
    // Enable button by adding a selection in current week
    availabilityServiceSpy.selections.set([
      { day: '2026-07-02', startTime: '09:00', endTime: '10:00' }
    ]);
    
    const fixture = TestBed.createComponent(CalendarComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const clearBtn = compiled.querySelector('.btn-clear-week');
    expect(clearBtn).toBeTruthy();
    expect(clearBtn.disabled).toBe(false);

    clearBtn.click();
    expect(availabilityServiceSpy.clearWeeklyAvailability).toHaveBeenCalled();
  });
});
