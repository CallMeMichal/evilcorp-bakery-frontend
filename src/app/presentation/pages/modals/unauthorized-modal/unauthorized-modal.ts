import { CommonModule } from '@angular/common';
import { Component, ApplicationRef } from '@angular/core';
import { hideUnauthorizedModal } from '../../../../core/services/auth/auth.interceptor';

@Component({
  selector: 'app-unauthorized-modal',
  imports: [CommonModule],
  templateUrl: './unauthorized-modal.html',
  styleUrl: './unauthorized-modal.scss'
})
export class UnauthorizedModal {
  constructor(private appRef: ApplicationRef) {}

  closeModal(): void {
    hideUnauthorizedModal(this.appRef);
  }
}