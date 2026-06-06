import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StudentDashboardComponent } from './dashboard';

describe('StudentDashboardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StudentDashboardComponent],
      providers: [provideRouter([])]
    });
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(StudentDashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
