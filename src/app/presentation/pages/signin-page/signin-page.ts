// src/app/pages/auth/signin-page/signin-page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-signin-page',
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './signin-page.html',
  styleUrl: './signin-page.scss'
})
export class SigninPage {
  email = '';
  password = '';
  rememberMe = false;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private router: Router, private authService : AuthService) {}

    onSignIn(): void {
    // Walidacja podstawowa
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = ''; // Wyczyść poprzednie błędy

    this.authService.login(this.email, this.password)
      .subscribe({
        next: (success) => {
          this.isLoading = false;
          
          if (success) {
            this.router.navigate(['/']);
          } else {
            this.errorMessage = 'Invalid email or password. Please try again.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'An error occurred. Please try again later.';
        }
      });
  }

  onGoogleSignIn(): void {
    console.log('Sign in with Google');
    // Implement Google OAuth logic here
  }

  onFacebookSignIn(): void {
    console.log('Sign in with Facebook');
    // Implement Facebook OAuth logic here
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  forgotPassword(): void {
    console.log('Forgot password clicked');
    // Implement forgot password logic here
  }
}