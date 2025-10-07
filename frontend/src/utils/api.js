// src/utils/api.js

'use client';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import dayjs from 'dayjs';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;


// Login API -------------------------------------------------------------------
export const loginAPI = async (endpoint, options = {}) => {
  const instance = axios.create({
    baseURL: BASE_URL,
  });

  try {
    const response = await instance.request({
      url: endpoint,
      method: options.method || 'GET',
      data: options.data || {},
      params: options.params || {},
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new Error('Invalid username or password. Please try again.');
    } else if (error.request) {
        throw new Error(`Network error: No response from the server. ${error.message}`);
    } else {
        throw new Error(`Request error: ${error.message}`);
    }
  }
};





// API Fetch -------------------------------------------------------------------
export const apiFetch = async (endpoint, options = {}) => {

  try {
    const accessToken = localStorage.getItem('access');
    const refreshToken = localStorage.getItem('refresh');

    const decodedAccess = jwtDecode(accessToken);
    const decodedRefresh = jwtDecode(refreshToken);
    
    const accessExpiryUTC = dayjs.unix(decodedAccess.exp);
    const refreshExpiryUTC = dayjs.unix(decodedRefresh.exp);
    
    const diffAccess = accessExpiryUTC.diff(dayjs(), 'second');
    const diffRefresh = refreshExpiryUTC.diff(dayjs(), 'second');
    
    console.log('Access token expires in', diffAccess, 'seconds');
    console.log('Refreshed token expires in', diffRefresh, 'seconds');
    // Handle expired refresh token
    if (diffRefresh < 0) {
      // localStorage.clear();
      // router.push('/login');
      throw new Error('Session expired. Please log in again.');
    } else {
      // Handle expired access token
      if (diffAccess < 0) {
        const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          refresh: refreshToken,
        });

        if (response.status == 200) {
          const data = response.data;
          localStorage.setItem('access', data.access);
          accessToken = data.access;
        } else {
          // localStorage.clear();
          // router.push('/login');
          throw new Error('Failed to refresh token');
        }
      }

      const instance = axios.create({
        baseURL: BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          ...options.headers,
        },
      });
    
      try {
        const response = await instance.request({
          url: endpoint,
          method: options.method || 'GET',
          data: options.data || {},
          params: options.params || {},
        });
        return response.data;
      } catch (error) {
        if (error.request) {
            throw new Error('Network error: No response from the server.');
        } else {
            throw new Error(`Request error: ${error.message}`);
        }
      }
    }
  } catch (error) {
    throw new Error(error.message);
  }
};


/**
 * Function to check if the access token is valid by making a GET request.
 */
export const checkAccess = async () => {
  try {
    const accessToken = localStorage.getItem('access');
    const refreshToken = localStorage.getItem('refresh');
    
    const decodedAccess = jwtDecode(accessToken);
    const decodedRefresh = jwtDecode(refreshToken);

    const accessExpiryUTC = dayjs.unix(decodedAccess.exp);
    const refreshExpiryUTC = dayjs.unix(decodedRefresh.exp);
    
    const diffAccess = accessExpiryUTC.diff(dayjs(), 'second');
    const diffRefresh = refreshExpiryUTC.diff(dayjs(), 'second');

    // Handle expired refresh token
    if (diffRefresh < 0) {
      localStorage.clear();
      return false;
    }

    // Handle expired access token
    if (diffAccess < 0) {
      const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        refresh: refreshToken,
      });

      if (response.status === 200) {
        const data = response.data;

        if (data.access) {
          localStorage.setItem('access', data.access);
          localStorage.setItem('refresh', refreshToken);
          return true;
        }
      } else {
        localStorage.clear();
        return false;
      }
    } else {
      return true;
    }
  } catch (error) {
    localStorage.clear();
    return false;
  }
};