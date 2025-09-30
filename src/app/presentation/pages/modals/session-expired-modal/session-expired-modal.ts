// session-expired-modal.ts
import { CommonModule } from '@angular/common';
import { Component, ApplicationRef } from '@angular/core';
import { Router } from '@angular/router';
import { hideSessionExpiredModal } from '../../../../core/services/auth/auth.interceptor'; 

@Component({
  selector: 'app-session-expired-modal',
  imports: [CommonModule],
  templateUrl: './session-expired-modal.html',
  styleUrl: './session-expired-modal.scss'
})
export class SessionExpiredModal {
  constructor(
    private router: Router,
    private appRef: ApplicationRef
  ) {}

  goToLogin(): void {
    hideSessionExpiredModal(this.appRef);
    this.router.navigate(['/signin']);
  }
}