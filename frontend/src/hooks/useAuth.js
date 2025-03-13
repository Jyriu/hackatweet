import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  loadUser, 
  loginUser, 
  registerUser, 
  logoutUser, 
  updateProfile 
} from '../redux/actions/userActions';

// Hook personnalisé pour l'authentification
export const useAuth = () => {
  const dispatch = useDispatch();
  const { currentUser, token, loading, error } = useSelector(state => state.user);

  // Charger l'utilisateur au montage du composant
  useEffect(() => {
    if (token && !currentUser) {
      dispatch(loadUser());
    }
  }, [token, currentUser, dispatch]);

  // Fonctions d'authentification
  const login = async (credentials) => {
    try {
      return await dispatch(loginUser(credentials)).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      return await dispatch(registerUser(userData)).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    dispatch(logoutUser());
  };

  const updateUserProfile = async (profileData) => {
    try {
      return await dispatch(updateProfile(profileData)).unwrap();
    } catch (error) {
      throw error;
    }
  };

  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = !!currentUser;

  return {
    user: currentUser,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile: updateUserProfile
  };
}; 