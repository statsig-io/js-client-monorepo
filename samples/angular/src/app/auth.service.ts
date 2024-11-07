import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _loggedIn = new BehaviorSubject<boolean>(false);

  login(email: string, password: string): Observable<boolean> {
    if (email && password) {
      return of(true).pipe(
        delay(2000),
        tap(() => {
          this._loggedIn.next(true);
        }),
      );
    }
    return of(false).pipe(delay(2000));
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this._loggedIn.next(false);
  }

  isLoggedIn(): Observable<boolean> {
    return this._loggedIn.asObservable();
  }
}
