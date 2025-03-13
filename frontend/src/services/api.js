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

export const fetchFollowingTweets = async (pageNumber, userId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/tweet/allTweetsByFollowings?page=${pageNumber}&limit=10&userId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
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

export const retweetTweet = async (tweetId, retweetContent, mediaUrl, hashtags) => {
  try {
    const response = await axios.post(`${API_URL}/api/tweet/retweet/${tweetId}`, {
      text: retweetContent,
      mediaUrl: mediaUrl,
      hashtags: hashtags
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (response.status === 201) {
      return response.data;
    } else {
      throw new Error('Failed to retweet');
    }
  } catch (error) {
    console.error("Error retweeting:", error);
    throw error;
  }
};

export const createTweet = async (tweetContent, selectedFile, link) => {
  try {
    const formData = new FormData();
    formData.append("content", tweetContent);

    if (selectedFile) {
      formData.append("media", selectedFile);
    }

    if (link) {
      formData.append("link", link);
    }

    const hashtags = tweetContent.match(/#\w+/g) || [];
    const mentions = tweetContent.match(/@\w+/g) || [];

    formData.append("hashtags", JSON.stringify(hashtags.map(tag => tag.slice(1))));
    formData.append("mentions", JSON.stringify(mentions.map(mention => mention.slice(1))));

    const response = await axios.post(`${API_URL}/api/tweet/tweets`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data; // Return the created tweet data
  } catch (error) {
    console.error("Error creating tweet:", error);
    throw error; // Throw the error to handle it in the component
  }
};



export const likeTweet = async (tweetId) => {
  try {
    const response = await axios.post(`${API_URL}/api/tweet/like/${tweetId}`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error liking tweet:", error);
    throw error;
  }
};

// api.js
export const bookmarkTweet = async (tweetId) => {
  try {
    const response = await axios.post(`${API_URL}/api/tweet/signet/${tweetId}`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error bookmarking tweet:", error);
    throw error;
  }
};

export const addComment = async (tweetId, text) => {
  try {
    const response = await axios.post(`${API_URL}/api/tweet/comment/${tweetId}`, { text }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

// Fetch comments for a tweet
export const getTweetComments = async (tweetId, page = 1, limit = 5) => {
  try {
    const response = await axios.get(`${API_URL}/api/tweet/allComments/${tweetId}`, {
      params: {
        page,
        limit
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tweet comments:", error);
    throw error;
  }
};

