import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleInfoSpy: any;
  let consoleDebugSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService]
    });
    service = TestBed.inject(LoggerService);

    // Spy on console methods
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should output logs in development mode', () => {
    service.setProductionMode(false);
    service.info('Test Info');
    service.debug('Test Debug');
    service.warn('Test Warn');
    service.error('Test Error');

    expect(consoleInfoSpy).toHaveBeenCalled();
    expect(consoleDebugSpy).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should suppress debug and info logs in production mode', () => {
    service.setProductionMode(true);
    service.info('Test Info');
    service.debug('Test Debug');
    service.warn('Test Warn');
    service.error('Test Error');

    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalled(); // Warns are never suppressed
    expect(consoleErrorSpy).toHaveBeenCalled(); // Errors are never suppressed
  });

  it('should format and log event tracking inputs', () => {
    service.trackEvent('click_button', 'Interaction', 'SubmitBtn', 10);
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Google Analytics Event] Action: "click_button"')
    );
  });

  it('should call global gtag if defined', () => {
    const mockGtag = vi.fn();
    vi.stubGlobal('gtag', mockGtag);

    service.trackEvent('click_button', 'Interaction', 'SubmitBtn', 10);
    expect(mockGtag).toHaveBeenCalledWith('event', 'click_button', {
      event_category: 'Interaction',
      event_label: 'SubmitBtn',
      value: 10
    });

    vi.unstubAllGlobals();
  });

  it('should log an error if gtag call throws', () => {
    const mockGtag = vi.fn().mockImplementation(() => {
      throw new Error('gtag error');
    });
    vi.stubGlobal('gtag', mockGtag);

    service.trackEvent('click_button', 'Interaction', 'SubmitBtn', 10);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ERROR] Failed to report event to Google Analytics',
      expect.any(Error)
    );

    vi.unstubAllGlobals();
  });
});
