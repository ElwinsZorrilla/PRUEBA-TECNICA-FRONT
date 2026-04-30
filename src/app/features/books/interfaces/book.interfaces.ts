import { FormControl } from '@angular/forms';
import { Book } from '../../../core/models/book.model';

export interface BookFormShape {
  title: FormControl<string | null>;
  description: FormControl<string | null>;
  pageCount: FormControl<number | null>;
  publishDate: FormControl<Date | null>;
  excerpt: FormControl<string | null>;
}

export interface EnrichedBook extends Book {
  authorName: string | null;
}
