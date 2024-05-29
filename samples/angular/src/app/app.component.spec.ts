import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { STATSIG_CLIENT, StatsigModule } from '@statsig/angular-bindings';
import { StatsigClient } from '@statsig/js-client';

import { STATSIG_CLIENT_KEY } from './Contants';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    const precomputedClient = new StatsigClient(STATSIG_CLIENT_KEY, {
      userID: 'a-user',
    });
    precomputedClient.initializeSync();
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule, StatsigModule],
      providers: [
        {
          provide: STATSIG_CLIENT,
          useValue: precomputedClient,
        },
      ],
    }).compileComponents();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Welcome angular-sample',
    );
  });
});
