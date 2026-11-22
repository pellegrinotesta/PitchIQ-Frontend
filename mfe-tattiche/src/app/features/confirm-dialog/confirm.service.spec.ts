import { TestBed } from '@angular/core/testing';

import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    // fornito dal componente che lo usa (EditorTattiche), non a livello di applicazione
    TestBed.configureTestingModule({ providers: [ConfirmService, DialogService] });
    service = TestBed.inject(ConfirmService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
