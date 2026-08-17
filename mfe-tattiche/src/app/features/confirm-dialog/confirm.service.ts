import { inject, Injectable } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable, from } from 'rxjs';
import { ConfirmDialog } from './confirm-dialog';

export class ConfirmService {
    private dialogService = inject(DialogService);

    conferma(options: {
        header?: string;
        messaggio: string;
        labelConferma?: string;
        labelAnnulla?: string;
        pericoloso?: boolean;
    }): Observable<boolean> {
        const ref = this.dialogService.open(ConfirmDialog, {
            header: options.header ?? 'Conferma',
            width: '380px',
            modal: true,
            closable: true,
            draggable: false,
            data: {
                messaggio: options.messaggio,
                labelConferma: options.labelConferma ?? 'Conferma',
                labelAnnulla: options.labelAnnulla ?? 'Annulla',
                pericoloso: options.pericoloso ?? true,
            },
        });

        return from(
            new Promise<boolean>(resolve => {
                ref?.onClose.subscribe((result: boolean) => resolve(result ?? false));
            })
        );
    }
}