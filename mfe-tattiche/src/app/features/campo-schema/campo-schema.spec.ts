import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampoSchema } from './campo-schema';

describe('CampoSchema', () => {
  let component: CampoSchema;
  let fixture: ComponentFixture<CampoSchema>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampoSchema],
    }).compileComponents();

    fixture = TestBed.createComponent(CampoSchema);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
