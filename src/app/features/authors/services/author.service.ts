import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Author, CreateAuthorRequest, UpdateAuthorRequest } from '../../../core/models/author.model';
import { CursorPage } from '../../../core/models/pagination.model';

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/authors`;

  getAll(): Observable<Author[]> {
    return this.http.get<Author[]>(this.baseUrl);
  }

  getPaged(cursor: string | null = null, pageSize: number = 10): Observable<CursorPage<Author>> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('pageSize', pageSize.toString());
    return this.http.get<CursorPage<Author>>(`${this.baseUrl}/paged?${params.toString()}`);
  }

  getById(id: number): Observable<Author> {
    return this.http.get<Author>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateAuthorRequest): Observable<Author> {
    return this.http.post<Author>(this.baseUrl, request);
  }

  update(id: number, request: UpdateAuthorRequest): Observable<Author> {
    return this.http.put<Author>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
