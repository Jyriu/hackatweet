import axios from 'axios';
import { setTweets, addTweet } from '../Store';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Action pour charger les tweets avec pagination
export const fetchTweets = (page = 1, limit = 10) => async (dispatch, getState) => {
  try {
    const currentTweets = getState().tweets || [];
    const isFirstPage = page === 1;
    
    // Si c'est la première page, réinitialiser les tweets
    if (isFirstPage) {
      dispatch(setTweets([]));
    }
    
    const response = await axios.get(`${API_URL}/api/tweet/tweets?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (isFirstPage) {
      dispatch(setTweets(response.data));
    } else {
      // Pour les pages suivantes, ajouter les nouveaux tweets aux existants
      dispatch(setTweets([...currentTweets, ...response.data]));
    }
    
    // Retourner des informations sur la requête
    return {
      hasMore: response.data.length === limit,
      newTweetsCount: response.data.length
    };
  } catch (error) {
    console.error('Erreur lors du chargement des tweets:', error);
    throw error;
  }
};

// Action pour poster un nouveau tweet
export const postNewTweet = (tweetData) => async (dispatch, getState) => {
  try {
    console.log("Tentative d'envoi de tweet à l'API avec données:", tweetData);
    
    // Examinons la structure d'un tweet existant pour comprendre le format
    const existingTweets = getState().tweets;
    if (existingTweets && existingTweets.length > 0) {
      console.log("Structure d'un tweet existant:", existingTweets[0]);
    }

    // Les hashtags sont extraits automatiquement côté serveur
    const adaptedData = {
      text: tweetData.content,
      mediaUrl: tweetData.mediaUrl || null
    };
    
    console.log("Données adaptées au format du contrôleur backend:", adaptedData);

    const response = await axios.post(`${API_URL}/api/tweet/createTweet`, adaptedData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log("Réponse du serveur après création de tweet:", response.data);
    dispatch(addTweet(response.data));
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création du tweet:', error);
    throw error;
  }
};

// Action pour aimer/ne plus aimer un tweet
export const toggleLikeTweet = (tweetId) => async (dispatch, getState) => {
  try {
    const response = await axios.post(`${API_URL}/api/tweet/${tweetId}/like`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Mettre à jour l'état des tweets
    const currentTweets = getState().tweets;
    const updatedTweets = currentTweets.map(tweet => 
      tweet._id === tweetId ? { ...tweet, likes: response.data.likes } : tweet
    );
    
    dispatch(setTweets(updatedTweets));
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de l'action like sur le tweet ${tweetId}:`, error);
    throw error;
  }
};

// Action pour retweeter/annuler un retweet
export const toggleRetweet = (tweetId) => async (dispatch, getState) => {
  try {
    const response = await axios.post(`${API_URL}/api/tweet/${tweetId}/retweet`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Mettre à jour l'état des tweets
    const currentTweets = getState().tweets;
    const updatedTweets = currentTweets.map(tweet => 
      tweet._id === tweetId ? { ...tweet, retweets: response.data.retweets } : tweet
    );
    
    dispatch(setTweets(updatedTweets));
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de l'action retweet sur le tweet ${tweetId}:`, error);
    throw error;
  }
};

// Action pour sauvegarder une émotion sur un tweet
export const saveEmotion = (tweetId, emotion) => async (dispatch) => {
  try {
    const response = await axios.post(`${API_URL}/api/emotions`, {
      tweetId,
      emotion
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement de l'émotion pour le tweet ${tweetId}:`, error);
    throw error;
  }
}; 