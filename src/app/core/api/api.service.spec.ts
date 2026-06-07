import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { LoggerService } from '../logging/logger.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        LoggerService
      ]
    });
    service = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should append Authorization header if token exists', () => {
    localStorage.setItem('access_token', 'my_secret_token');
    
    service.get('test-endpoint').subscribe();

    const req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer my_secret_token');
    req.flush({});
  });

  it('should directly return response on success', () => {
    const mockData = { id: 1, name: 'Test' };
    
    service.get<{ id: number }>('test-endpoint').subscribe(res => {
      expect(res).toEqual(mockData);
    });

    const req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.flush(mockData);
  });

  it('should throw immediately on 4xx client errors without retrying', () => {
    let receivedError: any = null;

    service.get('test-endpoint').subscribe({
      next: () => { throw new Error('Should have failed'); },
      error: err => receivedError = err
    });

    const req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.flush('Bad request', { status: 400, statusText: 'Bad Request' });

    expect(receivedError).toBeDefined();
    expect(receivedError.message).toContain('Bad request');
  });

  it('should retry up to 5 times on 5xx server errors with exponential delay', () => {
    vi.useFakeTimers();
    let receivedError: any = null;

    service.get('test-endpoint').subscribe({
      next: () => { throw new Error('Should have failed'); },
      error: err => receivedError = err
    });

    // 1st attempt (fails)
    let req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    
    // Retry 1: wait 1s
    vi.advanceTimersByTime(1000);
    req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    // Retry 2: wait 2s
    vi.advanceTimersByTime(2000);
    req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    // Retry 3: wait 4s
    vi.advanceTimersByTime(4000);
    req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    // Retry 4: wait 8s
    vi.advanceTimersByTime(8000);
    req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    // Retry 5: wait 16s
    vi.advanceTimersByTime(16000);
    req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(receivedError).toBeDefined();
    expect(receivedError.message).toContain('Server Error');
    vi.useRealTimers();
  });

  it('should perform POST requests', () => {
    const body = { data: 'test' };
    service.post('test-endpoint', body).subscribe(res => {
      expect(res).toEqual({ success: true });
    });
    const req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ success: true });
  });

  it('should perform PUT requests', () => {
    const body = { data: 'test' };
    service.put('test-endpoint', body).subscribe(res => {
      expect(res).toEqual({ success: true });
    });
    const req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({ success: true });
  });

  it('should perform DELETE requests', () => {
    service.delete('test-endpoint').subscribe(res => {
      expect(res).toEqual({ success: true });
    });
    const req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('should handle client-side/network ErrorEvent', () => {
    vi.useFakeTimers();
    let receivedError: any = null;

    service.get('test-endpoint').subscribe({
      next: () => { throw new Error('Should have failed'); },
      error: err => receivedError = err
    });

    const errorEvent = new ErrorEvent('Network error', {
      message: 'Failed to connect'
    });

    // 1st attempt
    let req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.error(errorEvent);

    // Retry 1: wait 1s
    vi.advanceTimersByTime(1000);
    req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.error(errorEvent);

    // Retry 2: wait 2s
    vi.advanceTimersByTime(2000);
    req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.error(errorEvent);

    // Retry 3: wait 4s
    vi.advanceTimersByTime(4000);
    req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.error(errorEvent);

    // Retry 4: wait 8s
    vi.advanceTimersByTime(8000);
    req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.error(errorEvent);

    // Retry 5: wait 16s
    vi.advanceTimersByTime(16000);
    req = httpTesting.expectOne(`${environment.backendApiUrl}/test-endpoint`);
    req.error(errorEvent);

    expect(receivedError).toBeDefined();
    expect(receivedError.message).toContain('Failed to connect');
    vi.useRealTimers();
  });
});
