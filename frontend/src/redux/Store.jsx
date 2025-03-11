import { configureStore, createSlice } from "@reduxjs/toolkit";

const tweetSlice = createSlice({
  name: "tweets",
  initialState: [],
  reducers: {
    setTweets: (state, action) => action.payload,
    addTweet: (state, action) => [...state, action.payload],
  },
});

export const { setTweets, addTweet } = tweetSlice.actions;

export const store = configureStore({
  reducer: {
    tweets: tweetSlice.reducer,
  },
});
