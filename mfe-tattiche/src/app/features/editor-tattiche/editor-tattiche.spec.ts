import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorTattiche } from './editor-tattiche';

describe('EditorTattiche', () => {
  let component: EditorTattiche;
  let fixture: ComponentFixture<EditorTattiche>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorTattiche],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorTattiche);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
