import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { AuthorService } from '../../services/author.service';
import { BookService } from '../../../books/services/book.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Author } from '../../../../core/models/author.model';
import { Book } from '../../../../core/models/book.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthorFormComponent } from '../author-form/author-form.component';
import { EnrichedAuthor } from '../../interfaces/author.interfaces';

@Component({
  selector: 'app-author-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './author-list.component.html'
})
export class AuthorListComponent {
  private authorService = inject(AuthorService);
  private bookService = inject(BookService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  protected readonly authors = signal<Author[]>([]);
  protected readonly books = signal<Book[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly currentCursor = signal<string | null>(null);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly previousCursor = signal<string | null>(null);
  protected readonly pageSize = signal<number>(10);
  protected readonly pageSizeOptions = [10, 20, 30, 40];

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentCursor.set(null);
    this.searchControl.setValue('');
    this.loadData();
  }

  protected readonly searchControl = new FormControl<string>('', { nonNullable: true });
  private readonly searchValue = toSignal(
    this.searchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)),
    { initialValue: '' }
  );

  protected readonly enrichedAuthors = computed<EnrichedAuthor[]>(() => {
    const bookIds = new Set(this.books().map(b => b.id));
    return this.authors().map(a => ({
      ...a,
      fullName: `${a.firstName} ${a.lastName}`,
      initials: `${a.firstName[0] ?? ''}${a.lastName[0] ?? ''}`.toUpperCase(),
      hasBook: bookIds.has(a.idBook)
    }));
  });

  protected readonly filteredAuthors = computed<EnrichedAuthor[]>(() => {
    const term = this.searchValue().toLowerCase().trim();
    if (!term) return this.enrichedAuthors();
    return this.enrichedAuthors().filter(a =>
      a.firstName.toLowerCase().includes(term) ||
      a.lastName.toLowerCase().includes(term) ||
      a.fullName.toLowerCase().includes(term) ||
      a.initials.toLowerCase().includes(term) ||
      a.idBook.toString().includes(term)
    );
  });

  protected readonly displayedColumns = ['index', 'author', 'idBook', 'books', 'actions'];
  protected readonly dataSource = new MatTableDataSource<EnrichedAuthor>();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    const cursor = this.currentCursor();
    forkJoin({
      paged: this.authorService.getPaged(cursor, this.pageSize()),
      books: this.bookService.getAll()
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ paged, books }) => {
      this.authors.set(paged.items);
      this.books.set(books);
      this.nextCursor.set(paged.nextCursor);
      this.previousCursor.set(paged.previousCursor);
      this.dataSource.data = this.filteredAuthors();
    });
  }

  protected onSearchChange(): void {
    this.currentCursor.set(null);
    this.dataSource.data = this.filteredAuthors();
  }

  protected nextPage(): void {
    if (this.nextCursor()) {
      this.currentCursor.set(this.nextCursor());
      this.searchControl.setValue('');
      this.loadData();
    }
  }

  protected previousPage(): void {
    if (this.previousCursor()) {
      this.currentCursor.set(this.previousCursor());
      this.searchControl.setValue('');
      this.loadData();
    }
  }

  protected firstPage(): void {
    this.currentCursor.set(null);
    this.searchControl.setValue('');
    this.loadData();
  }

  protected trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  protected openCreate(): void {
    this.dialog.open(AuthorFormComponent, { width: '480px' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) this.loadData();
      });
  }

  protected openEdit(id: number): void {
    const author = this.authors().find(a => a.id === id);
    if (author) {
      this.dialog.open(AuthorFormComponent, { width: '480px', data: { author } })
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(result => {
          if (result) this.loadData();
        });
    }
  }

  protected delete(author: EnrichedAuthor): void {
    const dialogData: ConfirmDialogData = {
      type: 'delete',
      title: 'Eliminar Autor',
      message: `¿Estás seguro de que deseas eliminar a "${author.fullName}"? Esta acción no se puede deshacer.`
    };
    this.dialog.open(ConfirmDialogComponent, { width: '400px', data: dialogData })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.authorService.delete(author.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.notification.success('Autor eliminado correctamente.');
              this.loadData();
            });
        }
      });
  }
}
