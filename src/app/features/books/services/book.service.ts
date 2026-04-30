import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Book, CreateBookRequest, UpdateBookRequest } from '../../../core/models/book.model';
import { CursorPage } from '../../../core/models/pagination.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/books`;

  getAll(): Observable<Book[]> {
    return this.http.get<Book[]>(this.baseUrl);
  }

  getPaged(cursor: string | null = null, pageSize: number = 10): Observable<CursorPage<Book>> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('pageSize', pageSize.toString());
    return this.http.get<CursorPage<Book>>(`${this.baseUrl}/paged?${params.toString()}`);
  }

  getById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateBookRequest): Observable<Book> {
    return this.http.post<Book>(this.baseUrl, request);
  }

  update(id: number, request: UpdateBookRequest): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
