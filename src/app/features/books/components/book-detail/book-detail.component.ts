import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BookService } from '../../services/book.service';
import { AuthorService } from '../../../authors/services/author.service';
import { Book } from '../../../../core/models/book.model';
import { Author } from '../../../../core/models/author.model';
import { BookFormComponent } from '../book-form/book-form.component';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatDialogModule
  ],
  templateUrl: './book-detail.component.html'
})
export class BookDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private authorService = inject(AuthorService);
  private breakpointObserver = inject(BreakpointObserver);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  protected readonly book = signal<Book | null>(null);
  protected readonly relatedAuthor = signal<Author | null>(null);
  protected readonly isLoading = signal(true);

  protected readonly isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  protected readonly authorFullName = computed(() => {
    const a = this.relatedAuthor();
    return a ? `${a.firstName} ${a.lastName}` : '';
  });

  protected readonly authorInitials = computed(() => {
    const a = this.relatedAuthor();
    if (!a) return '';
    return `${a.firstName[0] ?? ''}${a.lastName[0] ?? ''}`.toUpperCase();
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      book: this.bookService.getById(id),
      authors: this.authorService.getAll()
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.router.navigate(['/books']);
        }
        this.isLoading.set(false);
        return EMPTY;
      })
    ).subscribe(({ book, authors }) => {
      this.book.set(book);
      const author = authors.find(a => a.idBook === id) ?? null;
      this.relatedAuthor.set(author);
      this.isLoading.set(false);
    });
  }

  protected goBack(): void {
    this.router.navigate(['/books']);
  }

  protected goEdit(): void {
    const b = this.book();
    if (!b) return;
    this.dialog.open(BookFormComponent, { width: '720px', data: { book: b } })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.bookService.getById(b.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(updated => this.book.set(updated));
        }
      });
  }
}
