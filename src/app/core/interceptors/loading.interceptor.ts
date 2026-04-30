import { HttpInterceptorFn } from '@angular/common/http';
import { signal } from '@angular/core';
import { finalize } from 'rxjs/operators';

export const isLoadingSignal = signal(false);

let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  activeRequests++;
  if (activeRequests === 1) {
    isLoadingSignal.set(true);
  }

  return next(req).pipe(
    finalize(() => {
      activeRequests--;
      if (activeRequests === 0) {
        isLoadingSignal.set(false);
      }
    })
  );
};
