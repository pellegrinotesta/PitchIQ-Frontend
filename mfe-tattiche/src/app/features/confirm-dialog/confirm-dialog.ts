import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-confirm-dialog',
  imports: [ButtonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  get messaggio(): string {
    return this.config.data?.messaggio ?? 'Sei sicuro?';
  }

  get labelConferma(): string {
    return this.config.data?.labelConferma ?? 'Conferma';
  }

  get labelAnnulla(): string {
    return this.config.data?.labelAnnulla ?? 'Annulla';
  }

  get pericoloso(): boolean {
    return this.config.data?.pericoloso ?? true;
  }

  conferma(): void { this.ref.close(true); }
  annulla(): void { this.ref.close(false); }
}
