import { ComponentFixture, TestBed } from '@angular/core/testing';

import { STATSIG_INIT_CONFIG } from '@statsig/angular-bindings';

import { HomeComponent } from '../src/app/home/home.component';
import { getTestClient } from '../src/test-setup';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    const testClient = getTestClient();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        {
          provide: STATSIG_INIT_CONFIG,
          useValue: { client: testClient },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
