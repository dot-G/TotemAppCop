import Cookies from 'js-cookie';

export const setAuthToken = (token: string) => {
  // Guardamos el token por 1 día o el tiempo que desees
  Cookies.set('access_token', token, { 
    expires: 1, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

export const getAuthToken = () => Cookies.get('access_token');
export const logout = () => Cookies.remove('access_token');