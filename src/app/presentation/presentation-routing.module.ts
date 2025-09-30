import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';  
import { AboutPage } from './pages/about-page/about-page';
import { ProductPage } from './pages/product-page/product-page';
import { ContactPage } from './pages/contact-page/contact-page';
import { CheckoutPage } from './pages/checkout-page/checkout-page';
import { RegisterPage } from './pages/register-page/register-page';
import { SigninPage } from './pages/signin-page/signin-page';
import { UserDashboard } from './pages/dashboards/user-dashboard/user-dashboard';
import { AdminDashboard } from './pages/dashboards/admin-dashboard/admin-dashboard';

export const routes: Routes = [
    { path: '', component: HomePage },
    { path: 'about', component: AboutPage },
    { path: 'products', component: ProductPage },
    { path: 'contact', component: ContactPage },
    { path: 'checkout', component: CheckoutPage },
    { path: 'register', component: RegisterPage },
    { path: 'signin', component: SigninPage },
    { path: 'user-dashboard', component: UserDashboard },
    { path: 'admin-dashboard', component: AdminDashboard },
];
