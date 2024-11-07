import { ComponentFixture, TestBed } from '@angular/core/testing';

import { STATSIG_INIT_CONFIG } from '@statsig/angular-bindings';

import { LoadFromAuthComponent } from '../src/app/loadFromAuth/loadFromAuth.component';
import { getTestClient } from '../src/test-setup';

describe('LoadFromAuthComponent', () => {
  let component: LoadFromAuthComponent;
  let fixture: ComponentFixture<LoadFromAuthComponent>;

  beforeEach(async () => {
    const testClient = getTestClient();

    await TestBed.configureTestingModule({
      imports: [LoadFromAuthComponent],
      providers: [
        {
          provide: STATSIG_INIT_CONFIG,
          useValue: { client: testClient },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadFromAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
