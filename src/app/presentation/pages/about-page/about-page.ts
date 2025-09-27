import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-about-page',
  imports: [SharedModule],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss'
})
export class AboutPage {
  stats = [
    { number: '25+', label: 'Years Experience' },
    { number: '10k+', label: 'Happy Customers' },
    { number: '150+', label: 'Daily Products' },
    { number: '5', label: 'Master Bakers' }
  ];

  values = [
    {
      icon: 'fas fa-leaf',
      title: 'Quality First',
      description: 'We never compromise on quality. Every ingredient is carefully selected to ensure the finest taste and freshness.'
    },
    {
      icon: 'fas fa-heart',
      title: 'Made with Love',
      description: 'Our bakers pour their passion into every creation, treating each product as if it were for their own family.'
    },
    {
      icon: 'fas fa-users',
      title: 'Community Focused',
      description: 'We believe in building strong relationships with our customers and supporting our local community.'
    },
    {
      icon: 'fas fa-award',
      title: 'Excellence',
      description: 'We strive for perfection in every aspect of our business, from ingredients to customer service.'
    }
  ];

  timeline = [
    { year: '1998', title: 'The Beginning', description: 'Started as a small family bakery with just 3 recipes and big dreams.' },
    { year: '2005', title: 'First Expansion', description: 'Opened our second location and introduced 50+ new products.' },
    { year: '2012', title: 'Award Winner', description: 'Received "Best Local Bakery" award for 3 consecutive years.' },
    { year: '2020', title: 'Digital Innovation', description: 'Launched online ordering and delivery services.' },
    { year: '2024', title: 'Today', description: 'Serving thousands of customers daily with 150+ fresh products.' }
  ];
}
