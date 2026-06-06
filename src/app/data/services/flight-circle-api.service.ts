import { Injectable, inject, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { LoggerService } from '../../core/logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class FlightCircleApiService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly logger = inject(LoggerService);

  // Helper signal to get the current FboID (defaults to 1 if not authenticated)
  public readonly currentFboId = computed(() => {
    const user = this.auth.currentUser();
    // In our model structure, both StudentProfile and AdministratorProfile contain fboId
    if (user && 'fboId' in user) {
      return user.fboId;
    }
    return 1; // Default fallback
  });

  /**
   * Retrieves the list of aircrafts for the FBO.
   * GET /aircraft/{FboID}
   */
  public getAircrafts(): Observable<any[]> {
    const fboId = this.currentFboId();
    this.logger.debug(`Fetching aircrafts for FboID: ${fboId}`);
    return this.api.get<any[]>(`aircraft/${fboId}`);
  }

  /**
   * Retrieves the list of instructors for the FBO.
   * GET /instructors/{FboID}
   */
  public getInstructors(): Observable<any[]> {
    const fboId = this.currentFboId();
    this.logger.debug(`Fetching instructors for FboID: ${fboId}`);
    return this.api.get<any[]>(`instructors/${fboId}`);
  }

  /**
   * Retrieves the schedules for all instructors (or a specific one) within a time range.
   * GET /schedules/{FboID}/{InstructorID}/{year}/{month}/{day}/{eyear}/{emonth}/{eday}
   */
  public getSchedules(
    instructorId: string, // "all" or specific Instructor ID
    start: { year: number; month: number; day: number },
    end: { year: number; month: number; day: number }
  ): Observable<any[]> {
    const fboId = this.currentFboId();
    const path = `schedules/${fboId}/${instructorId}/${start.year}/${start.month}/${start.day}/${end.year}/${end.month}/${end.day}`;
    this.logger.debug(`Fetching schedules: ${path}`);
    return this.api.get<any[]>(path);
  }

  /**
   * Retrieves the schedules for a specific student within a time range.
   * GET /user/schedules/{FboID}/{UserID}/{year}/{month}/{day}/{eyear}/{emonth}/{eday}
   */
  public getStudentSchedules(
    studentId: number,
    start: { year: number; month: number; day: number },
    end: { year: number; month: number; day: number }
  ): Observable<any[]> {
    const fboId = this.currentFboId();
    const path = `user/schedules/${fboId}/${studentId}/${start.year}/${start.month}/${start.day}/${end.year}/${end.month}/${end.day}`;
    this.logger.debug(`Fetching student schedules: ${path}`);
    return this.api.get<any[]>(path);
  }
}
