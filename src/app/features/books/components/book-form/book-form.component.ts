import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { BookService } from '../../services/book.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CreateBookRequest, Book } from '../../../../core/models/book.model';
import { BookFormShape } from '../../interfaces/book.interfaces';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextFieldModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatDividerModule
  ],
  templateUrl: './book-form.component.html'
})
export class BookFormComponent {
  private dialogRef = inject(MatDialogRef<BookFormComponent>);
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true }) as { book?: Book } | undefined;
  private bookService = inject(BookService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  protected readonly bookId = signal<number | null>(null);
  protected readonly isEditMode = computed(() => this.bookId() !== null);
  protected readonly isSubmitting = signal(false);

  protected readonly form = new FormGroup<BookFormShape>({
    title: new FormControl<string | null>('', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]),
    description: new FormControl<string | null>('', [Validators.maxLength(500)]),
    pageCount: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    publishDate: new FormControl<Date | null>(null, [Validators.required]),
    excerpt: new FormControl<string | null>('', [Validators.maxLength(1000)])
  });

  protected readonly formValue = toSignal(
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)),
    { initialValue: this.form.getRawValue() }
  );

  protected readonly descriptionLength = computed(() => this.formValue().description?.length ?? 0);
  protected readonly excerptLength = computed(() => this.formValue().excerpt?.length ?? 0);

  constructor() {
    if (this.dialogData?.book) {
      const book = this.dialogData.book;
      this.bookId.set(book.id);
      this.form.patchValue({
        title: book.title,
        description: book.description,
        pageCount: book.pageCount,
        publishDate: new Date(book.publishDate),
        excerpt: book.excerpt
      });
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: CreateBookRequest = {
      title: v.title ?? '',
      description: v.description ?? '',
      pageCount: v.pageCount ?? 0,
      publishDate: (v.publishDate ?? new Date()).toISOString(),
      excerpt: v.excerpt ?? ''
    };

    this.isSubmitting.set(true);
    const id = this.bookId();
    const op = id !== null
      ? this.bookService.update(id, payload)
      : this.bookService.create(payload);

    op.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notification.success(this.isEditMode() ? 'Libro actualizado.' : 'Libro creado correctamente.');
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
