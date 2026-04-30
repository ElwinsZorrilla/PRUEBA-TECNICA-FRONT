import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'books', pathMatch: 'full' },
      {
        path: 'books',
        loadChildren: () => import('./features/books/books.routes').then(m => m.booksRoutes)
      },
      {
        path: 'authors',
        loadChildren: () => import('./features/authors/authors.routes').then(m => m.authorsRoutes)
      }
    ]
  },
  { path: '**', redirectTo: 'books' }
];
