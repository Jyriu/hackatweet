# Hackaton IA 2025

## Introduction

Hackatweet is an innovative project developed during the Hackathon IA 2025. The goal of this project is to leverage artificial intelligence to analyze and interact with tweets in real-time.

## Features

- **Real-time Tweet Analysis**: Analyze tweets as they are posted.
- **Sentiment Analysis**: Determine the sentiment of tweets (positive, negative, neutral).
- **Keyword Extraction**: Extract important keywords from tweets.
- **User Interaction**: Automatically respond to tweets based on predefined rules.

## Technologies Used

- **Programming Languages**: JavaScript, Python
- **Frameworks**: Node.js, Express, Django
- **APIs**: Twitter API
- **Databases**: MongoDB
- **AI/ML Libraries**: TensorFlow, scikit-learn

## Setup

To install and run the project locally, follow these steps:

**Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/hackatweet.git
   cd hackatweet
   ```

## Running the Project

1. 

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following variables:

   ```plaintext
   Backend:
   MONGODB_URI=mongodb+srv://samiyezza:8a08ad81@cluster0.uyxehij.mongodb.net/hackatweet
   PORT=5001
   JWT_SECRET=secret

   Frontend:
   VITE_BACKEND_URL=http://localhost:5001
   ```

4. **Run the application via commandes**:
   ```bash
   npm start
   ```

## Lancement via Docker Compose

Assurez-vous d'avoir Docker et Docker Compose installés.

1. Construisez et lancez les containers :
   ```bash
   docker-compose up --build
   ```
2. Accédez à l'application sur http://localhost:5001 (ou le port défini dans vos variables d'environnement).

## Usage

Once the application is running, it will start analyzing tweets in real-time. You can monitor the output in the console or set up a web interface to display the results.

## Project Structure

```
hackatweet/
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point of the backend application
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Controllers for handling requests
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   └── services/         # Services for business logic
│   ├── tests/                # Test cases
│   ├── .env                  # Environment variables
│   ├── package.json          # Project metadata and dependencies
│   └── README.md             # Backend documentation
├── frontend/
│   ├── src/                  # Frontend source code
│   ├── public/               # Public assets
│   ├── .env                  # Environment variables
│   ├── package.json          # Project metadata and dependencies
│   └── README.md             # Frontend documentation
├── IA/
│   ├── hackatweetapi/
│   │   ├── hackatweetapi/    # Django project files
│   │   ├── api/              # Django app for API
│   │   ├── manage.py         # Django management script
│   │   └── requirements.txt  # Python dependencies
├── scripts/                  # Scripts for data processing
├── docker-compose.yml        # Docker Compose configuration
└── README.md                 # Project documentation
```
