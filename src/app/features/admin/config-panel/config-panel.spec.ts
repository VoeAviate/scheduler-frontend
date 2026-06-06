import { TestBed } from '@angular/core/testing';
import { ConfigPanelComponent } from './config-panel';
import { AdminConfigService } from '../../../data/services/admin-config.service';
import { signal } from '@angular/core';

describe('ConfigPanelComponent', () => {
  let component: ConfigPanelComponent;
  let configServiceSpy: any;

  beforeEach(() => {
    configServiceSpy = {
      workingHours: signal({ startTime: '08:00', endTime: '18:00' }),
      minAircraftInterval: signal(60),
      defaultBriefing: signal(20),
      defaultDebriefing: signal(20),
      defaultMission: signal(120),
      updateWorkingHours: vi.fn(),
      updateMinAircraftInterval: vi.fn(),
      updateDefaultDurations: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [ConfigPanelComponent],
      providers: [
        { provide: AdminConfigService, useValue: configServiceSpy }
      ]
    });

    const fixture = TestBed.createComponent(ConfigPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and initialize fields from config service', () => {
    expect(component).toBeTruthy();
    expect(component['startHour']).toBe('08:00');
    expect(component['endHour']).toBe('18:00');
    expect(component['minInterval']).toBe(60);
    expect(component['briefingTime']).toBe(20);
    expect(component['debriefingTime']).toBe(20);
    expect(component['missionTime']).toBe(120);
  });

  it('should save configurations and update service methods', () => {
    vi.useFakeTimers();
    component['startHour'] = '07:00';
    component['endHour'] = '20:00';
    component['minInterval'] = 30;
    component['briefingTime'] = 30;
    component['debriefingTime'] = 30;
    component['missionTime'] = 90;

    component['onSaveConfig']();
    expect(component['isSaving']()).toBe(true);

    vi.advanceTimersByTime(1000);

    expect(configServiceSpy.updateWorkingHours).toHaveBeenCalledWith({
      startTime: '07:00',
      endTime: '20:00'
    });
    expect(configServiceSpy.updateMinAircraftInterval).toHaveBeenCalledWith(30);
    expect(configServiceSpy.updateDefaultDurations).toHaveBeenCalledWith(30, 30, 90);

    expect(component['isSaving']()).toBe(false);
    expect(component['isSaveSuccess']()).toBe(true);

    vi.advanceTimersByTime(3000);
    expect(component['isSaveSuccess']()).toBe(false);

    vi.useRealTimers();
  });
});
