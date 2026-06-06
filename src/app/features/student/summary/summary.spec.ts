import { TestBed } from '@angular/core/testing';
import { AvailabilitySummaryComponent } from './summary';
import { StudentAvailabilityService } from '../../../data/services/student-availability.service';
import { AuthService } from '../../../core/auth/auth.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { signal } from '@angular/core';
import { AvailabilitySlot } from '../../../data/models/availability.model';
import { UserType } from '../../../data/models/user.model';

describe('AvailabilitySummaryComponent', () => {
  let component: AvailabilitySummaryComponent;
  let availabilityServiceSpy: any;
  let authServiceSpy: any;
  let dateTimeService: DateTimeService;

  beforeEach(() => {
    availabilityServiceSpy = {
      selections: signal<AvailabilitySlot[]>([]),
      defaultWeeklyTemplate: signal([]),
      isSubmitting: signal(false),
      isSubmitSuccess: signal(false),
      totalSelectedHours: signal(0),
      confirmAvailability: vi.fn(),
      applyDefaultAvailability: vi.fn(),
      resetSubmitSuccess: vi.fn()
    };

    authServiceSpy = {
      currentUser: signal({
        userId: 101,
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserType.Student
      })
    };

    TestBed.configureTestingModule({
      imports: [AvailabilitySummaryComponent],
      providers: [
        DateTimeService,
        { provide: StudentAvailabilityService, useValue: availabilityServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    const fixture = TestBed.createComponent(AvailabilitySummaryComponent);
    component = fixture.componentInstance;
    dateTimeService = TestBed.inject(DateTimeService);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should group and merge contiguous slots correctly', () => {
    const slots: AvailabilitySlot[] = [
      { day: '2026-07-01', startTime: '08:00', endTime: '09:00' },
      { day: '2026-07-01', startTime: '09:00', endTime: '10:00' },
      { day: '2026-07-01', startTime: '11:00', endTime: '12:00' },
      { day: '2026-07-02', startTime: '14:00', endTime: '15:00' }
    ];

    availabilityServiceSpy.selections.set(slots);

    const grouped = component.groupedSelections();
    expect(grouped.length).toBe(2);

    // Day 1: 2026-07-01
    expect(grouped[0].day).toBe('2026-07-01');
    expect(grouped[0].slots.length).toBe(2);
    expect(grouped[0].slots[0]).toEqual({ startTime: '08:00', endTime: '10:00' }); // merged
    expect(grouped[0].slots[1]).toEqual({ startTime: '11:00', endTime: '12:00' }); // not merged

    // Day 2: 2026-07-02
    expect(grouped[1].day).toBe('2026-07-02');
    expect(grouped[1].slots.length).toBe(1);
    expect(grouped[1].slots[0]).toEqual({ startTime: '14:00', endTime: '15:00' });
  });

  it('should open and close confirmation modal when selections are present', () => {
    // Should not open if selections is empty
    component['openConfirmModal']();
    expect(component['isModalOpen']()).toBe(false);

    // Set some selections
    availabilityServiceSpy.selections.set([
      { day: '2026-07-01', startTime: '08:00', endTime: '09:00' }
    ]);

    component['openConfirmModal']();
    expect(component['isModalOpen']()).toBe(true);

    component['closeConfirmModal']();
    expect(component['isModalOpen']()).toBe(false);
  });

  it('should submit availability and close modal on confirm', () => {
    component['openConfirmModal']();
    component['onConfirmSubmit']();
    expect(availabilityServiceSpy.confirmAvailability).toHaveBeenCalledWith(101);
    expect(component['isModalOpen']()).toBe(false);
  });

  it('should call applyDefaultAvailability on service', () => {
    component['onApplyDefaultTemplate']();
    expect(availabilityServiceSpy.applyDefaultAvailability).toHaveBeenCalled();
  });

  it('should call resetSubmitSuccess on service', () => {
    component['onCloseSuccessCheck']();
    expect(availabilityServiceSpy.resetSubmitSuccess).toHaveBeenCalled();
  });

  it('should fallback to day string if formatting fails', () => {
    vi.spyOn(dateTimeService, 'formatSchedulerDate').mockImplementation(() => {
      throw new Error('Format Error');
    });

    availabilityServiceSpy.selections.set([
      { day: '2026-07-01', startTime: '08:00', endTime: '09:00' }
    ]);

    const grouped = component.groupedSelections();
    expect(grouped[0].formattedDay).toBe('2026-07-01');
  });
});
