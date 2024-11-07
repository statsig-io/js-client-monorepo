import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StatsigModule, StatsigService } from '@statsig/angular-bindings';

import { AuthService } from '../auth.service';
import { CodeSnippetComponent } from '../codeSnippet/codeSnippet.component';

@Component({
  selector: 'app-load-from-auth',
  standalone: true,
  imports: [CommonModule, StatsigModule, FormsModule, CodeSnippetComponent],
  templateUrl: './loadFromAuth.component.html',
  styleUrl: '../app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadFromAuthComponent implements OnInit {
  isLoading = false;
  email = '';
  password = '';
  buttonText = 'Login';
  snippet = `statsigService.getClient().updateUserSync({
    userID: USER_ID,
    email: USER_EMAIL,
    ... other attributes
  });`;
  gatePasses = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private statsigService: StatsigService,
  ) {}

  ngOnInit(): void {
    this.gatePasses = this.statsigService.checkGate('third_gate');
  }

  login(): void {
    this.buttonText = 'Logging in...';
    this.isLoading = true;
    this.authService.login(this.email, this.password).subscribe((success) => {
      this.isLoading = false;
      this.buttonText = 'Login';

      if (success) {
        this.statsigService.getClient().updateUserSync({
          userID: `user-${this.email}`,
          email: this.email,
        });
      }

      this.gatePasses = this.statsigService.checkGate('third_gate');
      this.cdr.detectChanges();
    });
  }

  logout(): void {
    this.authService.logout();
    this.statsigService.getClient().updateUserSync({ userID: undefined });
    this.gatePasses = false;
    this.cdr.detectChanges();
  }
}
