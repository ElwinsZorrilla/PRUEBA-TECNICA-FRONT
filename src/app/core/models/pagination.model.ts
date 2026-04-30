export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  previousCursor: string | null;
  pageSize: number;
}
