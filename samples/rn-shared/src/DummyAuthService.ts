import { DJB2, StatsigUser, Storage } from '@statsig/client-core';

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
    const userID = `user-${DJB2(data.email)}`;
    const user = { userID, email: data.email };
    await Storage.setItem(storageKey, JSON.stringify(user));

    const authorizedUser = user;

    return {
      authorizedUser, // An authenticated StatsigUser object
    };
  },

  getUser: async (): Promise<StatsigUser> => {
    const data = await Storage.getItem(storageKey);
    if (!data) {
      return { userID: '' };
    }

    return JSON.parse(data) as StatsigUser;
  },
  logout: (): void => {
    Storage.removeItem(storageKey).catch((e) => {
      // eslint-disable-next-line no-console
      console.error(e);
    });
  },
};

export const AuthService = service;
