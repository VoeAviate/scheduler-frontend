import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, timer, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  // Read backend base URL from local environment configuration or fall back to localhost
  private readonly baseUrl = 'http://localhost:3000/api';

  /**
   * Resilient HTTP GET wrapper with exponential back-off retry logic.
   */
  public get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${path}`, { headers: this.getHeaders() }).pipe(
      this.resiliencyPipeline<T>('GET', path),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Resilient HTTP POST wrapper with exponential back-off retry logic.
   */
  public post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${path}`, body, { headers: this.getHeaders() }).pipe(
      this.resiliencyPipeline<T>('POST', path),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Resilient HTTP PUT wrapper with exponential back-off retry logic.
   */
  public put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${path}`, body, { headers: this.getHeaders() }).pipe(
      this.resiliencyPipeline<T>('PUT', path),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Resilient HTTP DELETE wrapper with exponential back-off retry logic.
   */
  public delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${path}`, { headers: this.getHeaders() }).pipe(
      this.resiliencyPipeline<T>('DELETE', path),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Custom RxJS pipe operator applying standard exponential back-off strategy.
   */
  private resiliencyPipeline<T>(method: string, path: string) {
    return retry<T>({
      count: 5,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Only retry on network errors or transient 5xx server failures. Do not retry 4xx errors.
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        const backoffDelay = Math.pow(2, retryCount - 1) * 1000;
        this.logger.warn(
          `[Resiliency] API ${method} /${path} failed (Status: ${error.status}). ` +
          `Retrying in ${backoffDelay}ms (Attempt ${retryCount}/5)...`
        );
        return timer(backoffDelay);
      }
    });
  }

  /**
   * Standard header constructor, appends authorization tokens if present.
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const token = localStorage.getItem('access_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Centralized client error handler.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown network error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Connection error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful status code
      errorMessage = error.error || `Server returned code ${error.status}`;
    }

    this.logger.error(`[API Error] Request failed: ${errorMessage}`, error);
    return throwError(() => new Error(errorMessage));
  }
}
