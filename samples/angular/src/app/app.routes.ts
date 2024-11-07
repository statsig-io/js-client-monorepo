import { Route } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { LoadFromAuthComponent } from './loadFromAuth/loadFromAuth.component';

export const appRoutes: Route[] = [
  { path: 'auth', component: LoadFromAuthComponent },
  { path: '', component: HomeComponent },
];
