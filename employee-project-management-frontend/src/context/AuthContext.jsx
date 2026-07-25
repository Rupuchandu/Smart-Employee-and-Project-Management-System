import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCurrentUserProfile();
    }
  }, [token]);

  const fetchCurrentUserProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.data.success) {
        const uData = response.data.data;
        const updated = {
          email: uData.email,
          name: `${uData.firstName || ''} ${uData.lastName || ''}`.trim() || uData.email,
          role: uData.role,
          phone: uData.phone,
          profilePhoto: uData.profilePhoto,
          photoStatus: uData.photoStatus,
        };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to sync current user profile:', err);
    }
  };

  const login = async (emailOrToken, passwordOrUser) => {
    setLoading(true);
    try {
      // Direct token & user object signature: login(token, userData)
      if (typeof emailOrToken === 'string' && typeof passwordOrUser === 'object' && passwordOrUser !== null) {
        const jwtToken = emailOrToken;
        const userData = passwordOrUser;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        setLoading(false);
        return { success: true, message: 'Login successful' };
      }

      // API credentials signature: login(email, password)
      const response = await api.post('/auth/login', {
        email: emailOrToken,
        password: passwordOrUser,
      });

      if (response.data.success) {
        const { token: jwtToken, email, name, firstName, lastName, role, profilePhoto, photoStatus } = response.data.data;
        const userData = {
          email,
          name: name || `${firstName || ''} ${lastName || ''}`.trim() || email,
          role,
          profilePhoto,
          photoStatus,
        };

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        return { success: true, message: response.data.message || 'Login successful' };
      } else {
        return { success: false, message: response.data.message || 'Invalid email or password' };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid Email or Password';
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (signupData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', signupData);
      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message || 'Registration failed' };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
