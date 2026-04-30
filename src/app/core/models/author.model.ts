export interface Author {
  id: number;
  idBook: number;
  firstName: string;
  lastName: string;
}

export interface CreateAuthorRequest {
  idBook: number;
  firstName: string;
  lastName: string;
}

export interface UpdateAuthorRequest extends CreateAuthorRequest {}
