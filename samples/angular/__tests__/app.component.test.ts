import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { STATSIG_INIT_CONFIG, StatsigModule } from '@statsig/angular-bindings';

import { AppComponent } from '../src/app/app.component';
import { getTestClient } from '../src/test-setup';

describe('AppComponent', () => {
  beforeEach(async () => {
    const testClient = getTestClient();

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule, StatsigModule],
      providers: [
        {
          provide: STATSIG_INIT_CONFIG,
          useValue: { client: testClient },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
