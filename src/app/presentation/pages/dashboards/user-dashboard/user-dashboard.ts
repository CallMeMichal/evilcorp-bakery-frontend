import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterOutlet],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.scss'
})
export class UserDashboard implements OnInit {

  ngOnInit() {
    window.scrollTo(0, 0);
   
  }
}