# GreenPREP API

This is the backend API for the GreenPREP application. It is built using Node.js, Express, and Sequelize ORM for PostgreSQL.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [File Explanations](#file-explanations)
- [API Documentation](#api-documentation)
- [Scripts](#scripts)
- [License](#license)

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/your-repo/GreenPREP-API.git
    cd GreenPREP-API
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up the environment variables. Create a `.env` file in the root directory and add the following variables:
    ```env
    DATABASE_URL=your_database_url
    JWT_SECRET=your_jwt_secret
    EMAIL_SECRET=your_email_secret
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    FRONTEND_URL=your_frontend_url
    ```

4. Set up the database configuration in `etc/secrets/config.json`.

## Configuration

- `.env`: Environment variables for the application.
- `etc/secrets/config.json`: Database configuration for Sequelize.
- `etc/secrets/firebase.json`: Firebase service account credentials.

## Usage

Start the server:
```sh
npm start