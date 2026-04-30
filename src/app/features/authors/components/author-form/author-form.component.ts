import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthorService } from '../../services/author.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CreateAuthorRequest, Author } from '../../../../core/models/author.model';
import { AuthorFormShape } from '../../interfaces/author.interfaces';

@Component({
  selector: 'app-author-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './author-form.component.html'
})
export class AuthorFormComponent {
  private dialogRef = inject(MatDialogRef<AuthorFormComponent>);
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true }) as { author?: Author } | undefined;
  private authorService = inject(AuthorService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected readonly authorId = signal<number | null>(null);
  protected readonly isEditMode = computed(() => this.authorId() !== null);
  protected readonly isSubmitting = signal(false);

  protected readonly form = new FormGroup<AuthorFormShape>({
    firstName: new FormControl<string | null>('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    lastName: new FormControl<string | null>('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    idBook: new FormControl<number | null>(null, [Validators.required, Validators.min(1)])
  });

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)),
    { initialValue: this.form.getRawValue() }
  );

  protected readonly previewFullName = computed(() => {
    const v = this.formValue();
    const first = v.firstName ?? '';
    const last = v.lastName ?? '';
    const full = `${first} ${last}`.trim();
    return full || 'Nombre del autor';
  });

  protected readonly previewInitials = computed(() => {
    const v = this.formValue();
    const f = (v.firstName ?? '')[0] ?? '';
    const l = (v.lastName ?? '')[0] ?? '';
    return `${f}${l}`.toUpperCase() || '?';
  });

  constructor() {
    if (this.dialogData?.author) {
      const author = this.dialogData.author;
      this.authorId.set(author.id);
      this.form.patchValue({
        firstName: author.firstName,
        lastName: author.lastName,
        idBook: author.idBook
      });
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: CreateAuthorRequest = {
      firstName: v.firstName ?? '',
      lastName: v.lastName ?? '',
      idBook: v.idBook ?? 0
    };

    this.isSubmitting.set(true);
    const id = this.authorId();
    const op = id !== null
      ? this.authorService.update(id, payload)
      : this.authorService.create(payload);

    op.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notification.success(this.isEditMode() ? 'Autor actualizado.' : 'Autor creado correctamente.');
        this.form.markAsPristine();
        this.dialogRef.close(true);
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
