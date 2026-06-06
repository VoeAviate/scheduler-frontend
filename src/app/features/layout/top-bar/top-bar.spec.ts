import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TopBarComponent } from './top-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { DateTimeService } from '../../../core/date-time/date-time.service';
import { signal, computed } from '@angular/core';
import { EN_STRINGS, PT_STRINGS } from '../../../core/date-time/translations';

describe('TopBarComponent', () => {
  let component: TopBarComponent;
  let authServiceSpy: any;
  let dateTimeServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      logout: vi.fn(),
      currentUser: signal({
        userId: 101,
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'STUDENT'
      }),
      userRole: signal('STUDENT'),
      isAuthenticated: signal(true)
    };

    dateTimeServiceSpy = {
      locale: signal('en-US'),
      translations: signal(EN_STRINGS),
      setLocale: vi.fn()
    };

    routerSpy = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [TopBarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: DateTimeService, useValue: dateTimeServiceSpy }
      ]
    });

    const fixture = TestBed.createComponent(TopBarComponent);
    component = fixture.componentInstance;
    routerSpy = TestBed.inject(Router);
    vi.spyOn(routerSpy, 'navigate').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create the component and render the logo image', () => {
    expect(component).toBeTruthy();
    const compiled = TestBed.createComponent(TopBarComponent);
    compiled.detectChanges();
    const imgEl = compiled.nativeElement.querySelector('.logo-image');
    expect(imgEl).toBeTruthy();
    expect(imgEl.getAttribute('src')).toBe('logo_site.png');
  });

  it('should toggle and close drawer', () => {
    expect(component['isDrawerOpen']()).toBe(false);
    component['toggleDrawer']();
    expect(component['isDrawerOpen']()).toBe(true);
    component['closeDrawer']();
    expect(component['isDrawerOpen']()).toBe(false);
  });

  it('should toggle language', () => {
    dateTimeServiceSpy.locale.set('en-US');
    component['toggleLanguage']();
    expect(dateTimeServiceSpy.setLocale).toHaveBeenCalledWith('pt-BR');

    dateTimeServiceSpy.locale.set('pt-BR');
    component['toggleLanguage']();
    expect(dateTimeServiceSpy.setLocale).toHaveBeenCalledWith('en-US');
  });

  it('should call logout and navigate to login on logout', () => {
    component['onLogout']();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
