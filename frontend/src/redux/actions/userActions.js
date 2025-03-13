import axios from 'axios';
import {
  setUser,
  setToken,
  logout,
  setUserLoading,
  setUserError
} from '../Store';
import { connectToSocket, disconnectFromSocket } from './socketActions';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Action pour charger les informations de l'utilisateur
export const loadUser = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return;
  }
  
  try {
    dispatch(setUserLoading(true));
    
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    dispatch(setUser(response.data));
    dispatch(setUserError(null));
    dispatch(connectToSocket());
  } catch (error) {
    console.error('Erreur lors du chargement de l\'utilisateur:', error);
    dispatch(setUserError('Session expirée ou invalide'));
    dispatch(logout());
  } finally {
    dispatch(setUserLoading(false));
  }
};

// Action pour se connecter
export const loginUser = (credentials) => async (dispatch) => {
  try {
    dispatch(setUserLoading(true));
    
    const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
    
    dispatch(setToken(response.data.token));
    dispatch(setUser(response.data.user));
    dispatch(setUserError(null));
    dispatch(connectToSocket());
    
    return response.data;
  } catch (error) {
    console.error('Erreur de connexion:', error);
    const errorMessage = error.response?.data?.message || 'Erreur de connexion';
    dispatch(setUserError(errorMessage));
    throw error;
  } finally {
    dispatch(setUserLoading(false));
  }
};

// Action pour s'inscrire
export const registerUser = (userData) => async (dispatch) => {
  try {
    dispatch(setUserLoading(true));
    
    const response = await axios.post(`${API_URL}/api/auth/register`, userData);
    
    dispatch(setToken(response.data.token));
    dispatch(setUser(response.data.user));
    dispatch(setUserError(null));
    dispatch(connectToSocket());
    
    return response.data;
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    const errorMessage = error.response?.data?.message || 'Erreur lors de l\'inscription';
    dispatch(setUserError(errorMessage));
    throw error;
  } finally {
    dispatch(setUserLoading(false));
  }
};

// Action pour se déconnecter
export const logoutUser = () => (dispatch) => {
  dispatch(disconnectFromSocket());
  dispatch(logout());
};

// Action pour basculer un paramètre utilisateur (caméra, notifications, etc.)
export const toggleUserSetting = (setting) => async (dispatch) => {
  try {
    dispatch(setUserLoading(true));
    
    const response = await axios.put(
      `${API_URL}/api/users/toggle-setting/${setting}`, 
      {}, // Corps vide car le paramètre est dans l'URL
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    dispatch(setUser(response.data.user));
    dispatch(setUserError(null));
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors du basculement du paramètre ${setting}:`, error);
    const errorMessage = error.response?.data?.message || `Erreur lors du basculement de ${setting}`;
    dispatch(setUserError(errorMessage));
    throw error;
  } finally {
    dispatch(setUserLoading(false));
  }
};

// Action pour mettre à jour le profil
export const updateProfile = (profileData) => async (dispatch) => {
  try {
    dispatch(setUserLoading(true));
    
    const response = await axios.put(`${API_URL}/api/users/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    dispatch(setUser(response.data));
    dispatch(setUserError(null));
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour du profil';
    dispatch(setUserError(errorMessage));
    throw error;
  } finally {
    dispatch(setUserLoading(false));
  }
}; 