import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroPartite } from './registro-partite';

describe('RegistroPartite', () => {
  let component: RegistroPartite;
  let fixture: ComponentFixture<RegistroPartite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroPartite],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroPartite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
