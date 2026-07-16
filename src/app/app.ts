import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  public authService = inject(AuthService);
  readonly darkMode = signal(false);

  ngOnInit(): void {
    this.darkMode.set(localStorage.getItem('ihsan-theme') === 'dark');
  }

  toggleTheme(): void {
    this.darkMode.update(value => !value);
    localStorage.setItem('ihsan-theme', this.darkMode() ? 'dark' : 'light');
  }
}
