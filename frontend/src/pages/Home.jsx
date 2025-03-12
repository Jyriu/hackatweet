import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  CircularProgress 
} from "@mui/material";
import Tweet from "../components/Tweet";
import NewTweet from "../components/NewTweet";
import { useTweets } from "../hooks/useTweets";
import { v4 as uuidv4 } from 'uuid';

const Home = () => {
  console.log("Rendu du composant Home");
  
  // Utiliser le hook useTweets pour récupérer les tweets
  const { 
    tweets, 
    loading, 
    error, 
    hasMore, 
    loadMoreTweets, 
    createTweet 
  } = useTweets();
  
  const tweetsContainerRef = useRef(null);
  const [visibleTweetId, setVisibleTweetId] = useState(null);
  
  // Function to add a new tweet
  const addNewTweet = async (newTweetData) => {
    try {
      await createTweet(newTweetData);
    } catch (error) {
      console.error("Error creating tweet:", error);
    }
  };
  
  // Gérer l'intersection observer pour le défilement infini
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      loadMoreTweets();
    }
  }, [hasMore, loading, loadMoreTweets]);

  // Configurer l'intersection observer
  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0
    };
    
    const observer = new IntersectionObserver(handleObserver, option);
    
    if (tweetsContainerRef.current) {
      observer.observe(tweetsContainerRef.current);
    }
    
    return () => {
      if (tweetsContainerRef.current) {
        observer.unobserve(tweetsContainerRef.current);
      }
    };
  }, [handleObserver]);
  
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Accueil
      </Typography>
      
      <NewTweet onAddTweet={addNewTweet} />
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {tweets.map((tweet) => (
            <Tweet 
              key={tweet._id || uuidv4()} 
              tweet={tweet} 
              onInView={() => setVisibleTweetId(tweet._id)} 
            />
          ))}
          
          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          )}
          
          {error && (
            <Typography color="error" align="center" my={4}>
              {error}
            </Typography>
          )}
          
          <div ref={tweetsContainerRef} style={{ height: "20px" }} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;