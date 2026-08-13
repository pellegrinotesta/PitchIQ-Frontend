import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaAllenamenti } from './lista-allenamenti';

describe('ListaAllenamenti', () => {
  let component: ListaAllenamenti;
  let fixture: ComponentFixture<ListaAllenamenti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaAllenamenti],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaAllenamenti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
