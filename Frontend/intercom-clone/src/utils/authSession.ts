import type { AuthUser } from '../types/auth';

export const authSession = {
  saveUser: (user: AuthUser) => {
    localStorage.setItem('ticvic_user', JSON.stringify(user));
  },
  getUser: (): AuthUser | null => {
    const data = localStorage.getItem('ticvic_user');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },
  clearUser: () => {
    localStorage.removeItem('ticvic_user');
  }
};
