import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElencoGiocatori } from './elenco-giocatori';

describe('ElencoGiocatori', () => {
  let component: ElencoGiocatori;
  let fixture: ComponentFixture<ElencoGiocatori>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElencoGiocatori],
    }).compileComponents();

    fixture = TestBed.createComponent(ElencoGiocatori);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
