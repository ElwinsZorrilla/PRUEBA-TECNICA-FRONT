export interface Book {
  id: number;
  title: string;
  description: string;
  pageCount: number;
  excerpt: string;
  publishDate: string;
}

export interface CreateBookRequest {
  title: string;
  description: string;
  pageCount: number;
  excerpt: string;
  publishDate: string;
}

export interface UpdateBookRequest extends CreateBookRequest {}
