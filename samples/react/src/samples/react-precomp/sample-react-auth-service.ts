import { StatsigUser } from '@statsig/client-core';

type LoginFormData = {
  email: string;
  password: string;
};

type AuthResult = {
  bootstrapData: string;
  authorizedUser: StatsigUser;
};

const storageKey = 'fake_logged_in_user';

// prettier-ignore
// <snippet>
/* Service that hits your backend and authenticats a user */
const service = {
  login: async (data: LoginFormData): Promise<AuthResult> => {
// </snippet>

    await new Promise<void>((r) => setTimeout(r, 1000));
    const userID = `user-${btoa(data.email)}`;
    const user = { userID, email: data.email };
    localStorage.setItem(storageKey, JSON.stringify(user));

    const authorizedUser = user;
    const bootstrapData = '{}';

    // <snippet>
    return {
      authorizedUser, // An authenticated StatsigUser object
      bootstrapData // (optional) Values from a Statsig Server SDK
    }
    // </snippet>
  },

  getUser: (): StatsigUser => {
    const data = localStorage.getItem(storageKey);
    if (!data) {
      return { userID: '' };
    }

    return JSON.parse(data) as StatsigUser;
  },
  logout: (): void => {
    localStorage.removeItem(storageKey);
    // <snippet>
  },
};

export const authService = service;
