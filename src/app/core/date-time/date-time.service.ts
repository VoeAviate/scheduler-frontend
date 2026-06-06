import { Injectable, signal } from '@angular/core';
import { format, parseISO, addHours, addDays, differenceInMinutes, parse, formatISO } from 'date-fns';

@Injectable({
  providedIn: 'root'
})
export class DateTimeService {
  // Locale state signal (defaults to browser language or Portuguese/English)
  public readonly locale = signal<'en-US' | 'pt-BR'>('en-US');

  constructor() {
    this.detectLanguagePreference();
  }

  /**
   * Set user preferred locale.
   */
  public setLocale(newLocale: 'en-US' | 'pt-BR'): void {
    this.locale.set(newLocale);
    localStorage.setItem('user_language', newLocale);
  }

  /**
   * Formats a UTC ISO string to the user's localized visual format.
   */
  public formatToLocale(isoString: string, options: Intl.DateTimeFormatOptions): string {
    try {
      const date = parseISO(isoString);
      return new Intl.DateTimeFormat(this.locale(), options).format(date);
    } catch {
      return '';
    }
  }

  /**
   * Combines a calendar date (YYYY-MM-DD) and a time slot (HH:mm) into a UTC ISO 8601 string.
   */
  public combineToUtcIso(day: string, time: string): string {
    const combinedString = `${day}T${time}:00`;
    // Parse combined local string to Date object
    const dateObj = parse(combinedString, "yyyy-MM-dd'T'HH:mm:ss", new Date());
    // Format to ISO UTC format
    return dateObj.toISOString();
  }

  /**
   * Adds hours to a date object or ISO string.
   */
  public addHours(date: Date | string, hours: number): Date {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return addHours(parsedDate, hours);
  }

  /**
   * Adds days to a date object or ISO string.
   */
  public addDays(date: Date | string, days: number): Date {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return addDays(parsedDate, days);
  }

  /**
   * Calculates difference in hours between two dates.
   */
  public getDifferenceInHours(start: string | Date, end: string | Date): number {
    const parsedStart = typeof start === 'string' ? parseISO(start) : start;
    const parsedEnd = typeof end === 'string' ? parseISO(end) : end;
    return differenceInMinutes(parsedEnd, parsedStart) / 60;
  }

  /**
   * Formats a standard JS Date to YYYY-MM-DD.
   */
  public formatToIsoDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  /**
   * Detects the browser language preference or reads from localStorage.
   */
  private detectLanguagePreference(): void {
    const cachedLanguage = localStorage.getItem('user_language');
    if (cachedLanguage === 'en-US' || cachedLanguage === 'pt-BR') {
      this.locale.set(cachedLanguage);
      return;
    }

    const browserLang = navigator.language;
    if (browserLang.startsWith('pt')) {
      this.locale.set('pt-BR');
    } else {
      this.locale.set('en-US');
    }
  }
}
