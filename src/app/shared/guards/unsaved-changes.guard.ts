import { Signal, inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';

export interface UnsavedChangesAware {
  form: FormGroup;
  isSubmitting: Signal<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<UnsavedChangesAware> = (component) => {
  if (!component.form.dirty || component.isSubmitting()) {
    return true;
  }
  const dialog = inject(MatDialog);
  return dialog.open(ConfirmDialogComponent, {
    width: '400px',
    data: {
      type: 'unsaved',
      title: '¿Descartar cambios?',
      message: 'Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?'
    }
  }).afterClosed() as Observable<boolean>;
};
