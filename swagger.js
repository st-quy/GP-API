// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Final Backend API',
    version: '1.0.0',
    description: 'API documentation for Final Backend project',
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? `${process.env.DEPLOY_URL}/api`
        : 'http://localhost:3010/api',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Path to the API docs
  apis: ['./Controller/*.js', './models/*.js', './routes/*.js'], // files containing annotations as above

};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};