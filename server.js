// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./models');
const cookieParser = require('cookie-parser');
const app = express();
const { swaggerUi, swaggerSpec } = require('./swagger');
const { initializeBucket } = require('./services/MinIOService');
const http = require('http');
const https = require('https');
const fs = require('fs');
const PORT = process.env.PORT || 3000;
const USE_HTTPS = String(process.env.USE_HTTPS).toLowerCase() === 'true';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || './ssl/key.pem';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || './ssl/cert.pem';

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', require('./routes'));

(async () => {
  await initializeBucket(); //Just for the first time
})();

db.sequelize
  .sync({ alter: true })
  // .authenticate()
  .then(async () => {
    console.log('Database synchronized and models updated successfully.');
    if (USE_HTTPS) {
      const sslOptions = {
        key: fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH),
      };

      https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`HTTPS server is running on port ${PORT}`);
      });
      return;
    }

    http.createServer(app).listen(PORT, () => {
      console.log(`HTTP server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error synchronizing the database:', error);
  });
