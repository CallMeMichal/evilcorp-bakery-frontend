import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Header } from './header/header'; 
import { Footer } from './footer/footer';
import { UserPanel } from './user-panel/user-panel';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    Header,
    Footer,
    UserPanel
  ],
  exports: [
    Header,
    Footer,
    UserPanel
  ]
})
export class SharedModule { }