import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PLAUSIBLE_DOMAIN, PLAUSIBLE_SCRIPT_URL } from '../constants/analytics.constants';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });

    service = TestBed.inject(AnalyticsService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should be disabled in development mode', () => {
    expect(service.isEnabled()).toBeFalse();
  });

  it('should not load script when init is called in development mode', () => {
    const appendChildSpy = spyOn(document.head, 'appendChild');

    service.init();

    expect(appendChildSpy).not.toHaveBeenCalled();
  });

  it('should use the site-specific plausible script url', () => {
    expect(PLAUSIBLE_SCRIPT_URL).toContain('plausible.io/js/pa-');
    expect(PLAUSIBLE_DOMAIN).toBe('nouploadvideo.com');
  });
});
