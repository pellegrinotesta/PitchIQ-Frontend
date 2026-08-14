import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfrontoGiocatori } from './confronto-giocatori';

describe('ConfrontoGiocatori', () => {
  let component: ConfrontoGiocatori;
  let fixture: ComponentFixture<ConfrontoGiocatori>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfrontoGiocatori],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfrontoGiocatori);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
