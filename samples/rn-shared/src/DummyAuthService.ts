import { StatsigUser, Storage, _DJB2 } from '@statsig/client-core';

type LoginFormData = {
  email: string;
  password: string;
};

type AuthResult = {
  authorizedUser: StatsigUser;
};

const storageKey = 'fake_logged_in_user';

const service = {
  login: async (data: LoginFormData): Promise<AuthResult> => {
    await new Promise<void>((r) => setTimeout(r, 1000));
    const userID = `user-${_DJB2(data.email)}`;
    const user = { userID, email: data.email };
    Storage._setItem(storageKey, JSON.stringify(user));

    const authorizedUser = user;

    return {
      authorizedUser, // An authenticated StatsigUser object
    };
  },

  getUser: (): StatsigUser => {
    const data = Storage._getItem(storageKey);
    if (!data) {
      return { userID: '' };
    }

    return JSON.parse(data) as StatsigUser;
  },
  logout: (): void => {
    Storage._removeItem(storageKey);
  },
};

export const AuthService = service;
