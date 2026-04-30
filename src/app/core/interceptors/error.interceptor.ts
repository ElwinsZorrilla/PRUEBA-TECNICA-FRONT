import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        notification.error('No se pudo conectar con el servidor.');
      } else if (error.status === 400) {
        const errors = error.error?.errors as Record<string, string[]> | undefined;
        if (errors) {
          const messages = Object.values(errors).flat().join(' ');
          notification.error(messages || 'Solicitud inválida.');
        } else {
          notification.error(error.error?.detail || 'Solicitud inválida.');
        }
      } else if (error.status === 404) {
        notification.error('Recurso no encontrado.');
      } else if (error.status >= 500) {
        notification.error('Error del servidor. Intenta nuevamente.');
      } else {
        notification.error('Ocurrió un error inesperado.');
      }
      return throwError(() => error);
    })
  );
};
