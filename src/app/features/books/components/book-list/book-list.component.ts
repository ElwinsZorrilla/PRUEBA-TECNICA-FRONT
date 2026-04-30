import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
import { BookService } from '../../services/book.service';
import { AuthorService } from '../../../authors/services/author.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Book } from '../../../../core/models/book.model';
import { Author } from '../../../../core/models/author.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BookFormComponent } from '../book-form/book-form.component';
import { EnrichedBook } from '../../interfaces/book.interfaces';

@Component({
  selector: 'app-book-list',
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
  templateUrl: './book-list.component.html'
})
export class BookListComponent {
  private bookService = inject(BookService);
  private authorService = inject(AuthorService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly books = signal<Book[]>([]);
  protected readonly allBooks = signal<Book[]>([]);
  protected readonly authors = signal<Author[]>([]);
  protected readonly isLoading = signal(true);

  protected readonly currentYear = new Date().getFullYear();
  protected readonly totalBooks = computed(() => this.allBooks().length);
  protected readonly totalAuthors = computed(() => this.authors().length);
  protected readonly currentYearPublished = computed(() =>
    this.allBooks().filter(b => new Date(b.publishDate).getFullYear() === this.currentYear).length
  );
  protected readonly avgPageCount = computed(() => {
    const books = this.allBooks();
    if (books.length === 0) return 0;
    const sum = books.reduce((acc, b) => acc + b.pageCount, 0);
    return Math.round(sum / books.length);
  });
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

  protected readonly enrichedBooks = computed<EnrichedBook[]>(() => {
    const authorMap = new Map<number, Author>();
    for (const a of this.authors()) {
      if (!authorMap.has(a.idBook)) authorMap.set(a.idBook, a);
    }
    return this.books().map(b => {
      const author = authorMap.get(b.id);
      return {
        ...b,
        authorName: author ? `${author.firstName} ${author.lastName}` : null
      };
    });
  });

  protected readonly filteredBooks = computed<EnrichedBook[]>(() => {
    const term = this.searchValue().toLowerCase().trim();
    if (!term) return this.enrichedBooks();
    return this.enrichedBooks().filter(b =>
      b.title.toLowerCase().includes(term) ||
      b.description.toLowerCase().includes(term) ||
      b.excerpt.toLowerCase().includes(term) ||
      b.pageCount.toString().includes(term) ||
      new Date(b.publishDate).toLocaleDateString('es-ES').includes(term) ||
      new Date(b.publishDate).getFullYear().toString().includes(term) ||
      (b.authorName?.toLowerCase().includes(term) ?? false)
    );
  });

  protected readonly displayedColumns = ['index', 'title', 'pageCount', 'publishDate', 'author', 'actions'];
  protected readonly dataSource = new MatTableDataSource<EnrichedBook>();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    const cursor = this.currentCursor();
    forkJoin({
      paged: this.bookService.getPaged(cursor, this.pageSize()),
      allBooks: this.bookService.getAll(),
      authors: this.authorService.getAll()
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ paged, allBooks, authors }) => {
      this.books.set(paged.items);
      this.allBooks.set(allBooks);
      this.authors.set(authors);
      this.nextCursor.set(paged.nextCursor);
      this.previousCursor.set(paged.previousCursor);
      this.dataSource.data = this.filteredBooks();
    });
  }

  protected onSearchChange(): void {
    this.currentCursor.set(null);
    this.dataSource.data = this.filteredBooks();
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
    this.dialog.open(BookFormComponent, { width: '720px' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) this.loadData();
      });
  }

  protected openDetail(id: number): void {
    this.router.navigate(['/books', id]);
  }

  protected openEdit(id: number): void {
    const book = this.books().find(b => b.id === id);
    if (book) {
      this.dialog.open(BookFormComponent, { width: '720px', data: { book } })
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(result => {
          if (result) this.loadData();
        });
    }
  }

  protected truncate(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  protected delete(book: EnrichedBook): void {
    const dialogData: ConfirmDialogData = {
      type: 'delete',
      title: 'Eliminar Libro',
      message: `¿Estás seguro de que deseas eliminar "${book.title}"? Esta acción no se puede deshacer.`
    };
    this.dialog.open(ConfirmDialogComponent, { width: '400px', data: dialogData })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.bookService.delete(book.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.notification.success('Libro eliminado correctamente.');
              this.loadData();
            });
        }
      });
  }
}
