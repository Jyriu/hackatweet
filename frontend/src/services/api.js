import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;
//const API_URL = "http://localhost:5000"; // Modifier selon le backend


export const postTweet = async (content) => {
  const response = await axios.post(`${API_URL}/tweets`, { content });
  return response.data;
};

export const fetchTweetsFromApi = async (pageNumber, userId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/tweet/tweets?page=${pageNumber}&limit=10&userId=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching tweets:", error);
    throw error; // Re-throw the error to be handled in the component
  }
};

export const saveEmotionToApi = async (userId, tweetId, emotion) => {
    try {
        const response = await axios.post(`${API_URL}/api/emotions/emotions/`, {
            user_id: userId,
            tweet_id: tweetId,
            emotion: emotion,
        });
        return response.data;
    } catch (error) {
        console.error("Error saving emotion:", error);
        throw error; // Re-throw the error
    }
};