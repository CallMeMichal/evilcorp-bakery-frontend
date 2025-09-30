// src/app/pages/auth/register-page/register-page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

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

  constructor(private router: Router) {}

  onRegister(): void {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!this.agreeToTerms) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    console.log('Registration data:', {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      dateOfBirth: this.dateOfBirth,
      password: this.password,
      dietaryPreferences: {
        vegan: this.vegan,
        glutenFree: this.glutenFree,
        sugarFree: this.sugarFree,
        keto: this.keto
      },
      notifications: {
        email: this.emailUpdates,
        sms: this.smsNotifications
      }
    });

    // Implement registration logic here
    // For now, navigate to signin
    this.router.navigate(['/signin']);
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