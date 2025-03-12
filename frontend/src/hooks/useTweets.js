import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTweets as fetchTweetsAction, 
  postNewTweet,
  toggleLikeTweet,
  toggleRetweet,
  saveEmotion
} from '../redux/actions/tweetActions';

export const useTweets = () => {
  const dispatch = useDispatch();
  const tweets = useSelector(state => state.tweets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Charger les tweets initiaux
  useEffect(() => {
    loadTweets(1);
  }, []);

  // Fonction pour charger les tweets
  const loadTweets = async (pageNumber = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dispatch(fetchTweetsAction(pageNumber, limit));
      
      setHasMore(result.hasMore);
      setPage(pageNumber);
    } catch (error) {
      setError('Erreur lors du chargement des tweets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger plus de tweets (pagination)
  const loadMoreTweets = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      await loadTweets(nextPage);
    }
  };

  // Fonction pour créer un nouveau tweet
  const createTweet = async (tweetData) => {
    try {
      setError(null);
      const newTweet = await dispatch(postNewTweet(tweetData));
      return newTweet;
    } catch (error) {
      setError('Erreur lors de la création du tweet');
      console.error(error);
      throw error;
    }
  };

  // Fonction pour aimer/ne plus aimer un tweet
  const likeTweet = async (tweetId) => {
    try {
      setError(null);
      await dispatch(toggleLikeTweet(tweetId));
    } catch (error) {
      setError(`Erreur lors de l'action like sur le tweet`);
      console.error(error);
    }
  };

  // Fonction pour retweeter/annuler un retweet
  const retweetTweet = async (tweetId) => {
    try {
      setError(null);
      await dispatch(toggleRetweet(tweetId));
    } catch (error) {
      setError(`Erreur lors de l'action retweet`);
      console.error(error);
    }
  };

  // Fonction pour sauvegarder une émotion
  const saveEmotionForTweet = async (tweetId, emotion) => {
    try {
      setError(null);
      return await dispatch(saveEmotion(tweetId, emotion));
    } catch (error) {
      setError(`Erreur lors de l'enregistrement de l'émotion`);
      console.error(error);
    }
  };

  return {
    tweets,
    loading,
    error,
    hasMore,
    loadTweets,
    loadMoreTweets,
    createTweet,
    likeTweet,
    retweetTweet,
    saveEmotionForTweet
  };
}; 