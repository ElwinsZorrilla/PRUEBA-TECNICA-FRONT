import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { isLoadingSignal } from '../../../core/interceptors/loading.interceptor';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatCardModule],
  templateUrl: './loading-spinner.component.html'
})
export class LoadingSpinnerComponent {
  protected readonly isLoading = isLoadingSignal;
}
