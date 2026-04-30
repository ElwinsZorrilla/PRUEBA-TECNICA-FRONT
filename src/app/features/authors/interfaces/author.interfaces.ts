import { FormControl } from '@angular/forms';
import { Author } from '../../../core/models/author.model';

export interface AuthorFormShape {
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  idBook: FormControl<number | null>;
}

export interface EnrichedAuthor extends Author {
  fullName: string;
  initials: string;
  hasBook: boolean;
}
