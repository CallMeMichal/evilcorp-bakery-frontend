// src/app/pages/auth/register-page/register-page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module'; 
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss'
})
export class RegisterPage {
  firstName = '';
  lastName = '';
  email = '';
  phoneNumber = '';
  dateOfBirth = '';
  password = '';
  confirmPassword = '';
  
  // Dietary preferences
  vegan = false;
  glutenFree = false;
  sugarFree = false;
  keto = false;
  
  // Notifications
  emailUpdates = false;
  smsNotifications = false;
  
  // Terms agreement
  agreeToTerms = false;

  constructor(private router: Router, private authService: AuthService) {}

  onRegister(): void {

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Walidacja zgody na regulamin
    if (!this.agreeToTerms) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Przygotowanie FormData
    const formData = new FormData();
    formData.append('name', this.firstName);           
    formData.append('surname', this.lastName);         
    formData.append('email', this.email);
    formData.append('phoneNumber', this.phoneNumber);
    formData.append('dateOfBirth', this.dateOfBirth);
    formData.append('password', this.password);
    
    console.log('FormData contents:');
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    this.authService.register(formData).subscribe({
      next: (success) => {
        if (success) {
          alert('Registration successful! Please sign in.');
          this.router.navigate(['/signin']);
        } else {
          alert('Registration failed. Please try again.');
        }
      },
      error: (error) => {
        console.error('Registration error:', error);
        alert('An error occurred during registration. Please try again.');
      }
    });

  }

  onGoogleSignUp(): void {
    console.log('Sign up with Google');
    // Implement Google OAuth logic here
  }

  onFacebookSignUp(): void {
    console.log('Sign up with Facebook');
    // Implement Facebook OAuth logic here
  }

  goToSignIn(): void {
    this.router.navigate(['/signin']);
  }

  getPasswordStrength(): string {
    if (!this.password) return '';
    if (this.password.length < 6) return 'Weak';
    if (this.password.length < 10) return 'Medium';
    return 'Strong';
  }
}