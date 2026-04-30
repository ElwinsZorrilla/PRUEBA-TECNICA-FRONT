import { Routes } from '@angular/router';

export const booksRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/book-list/book-list.component').then(m => m.BookListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/book-detail/book-detail.component').then(m => m.BookDetailComponent)
  }
];
