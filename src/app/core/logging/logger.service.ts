import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  // Production Mode toggle signal (defaults to false in dev, can be configured via Admin configs)
  public readonly isProductionMode = signal<boolean>(false);

  /**
   * Toggles the global log suppression state.
   */
  public setProductionMode(isProd: boolean): void {
    this.isProductionMode.set(isProd);
  }

  /**
   * Output debug log messages.
   */
  public debug(message: string, ...optionalParams: any[]): void {
    if (!this.isProductionMode()) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }

  /**
   * Output informational log messages.
   */
  public info(message: string, ...optionalParams: any[]): void {
    if (!this.isProductionMode()) {
      console.info(`[INFO] ${message}`, ...optionalParams);
    }
  }

  /**
   * Output warning messages. Always output, regardless of production state.
   */
  public warn(message: string, ...optionalParams: any[]): void {
    console.warn(`[WARN] ${message}`, ...optionalParams);
  }

  /**
   * Output error messages. Always output, regardless of production state.
   */
  public error(message: string, ...optionalParams: any[]): void {
    console.error(`[ERROR] ${message}`, ...optionalParams);
  }

  /**
   * Tracks user interaction events and reports them to Google Analytics (mock integration).
   */
  public trackEvent(action: string, category: string, label?: string, value?: number): void {
    this.info(`[Google Analytics Event] Action: "${action}" | Category: "${category}" | Label: "${label || 'N/A'}" | Value: ${value ?? 0}`);
    
    // Check if global gtag API is defined on the window object
    const win = window as any;
    if (typeof win.gtag === 'function') {
      try {
        win.gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value
        });
      } catch (err) {
        this.error('Failed to report event to Google Analytics', err);
      }
    }
  }
}
