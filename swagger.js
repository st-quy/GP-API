// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GreenPREP API',
    version: '1.0.0',
    description:
      'API documentation for GreenPREP - APTIS Test Preparation Platform.\n\n' +
      '## Overview\n' +
      'GreenPREP provides APIs for managing exam sessions, grading, question banks, and user accounts.\n\n' +
      '## Authentication\n' +
      'Most endpoints require a Bearer JWT token. Obtain one via `POST /users/login`.\n' +
      'Public endpoints: register, login, forgot-password, reset-password.',
    contact: {
      name: 'GreenPREP Team',
    },
  },
  servers: [
    {
      url:
        process.env.NODE_ENV === 'production'
          ? `${process.env.DEPLOY_URL}/api`
          : 'https://localhost:3010/api',
      description:
        process.env.NODE_ENV === 'production'
          ? 'Production server'
          : 'Development server (HTTPS)',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & password recovery' },
    { name: 'User', description: 'User account management' },
    { name: 'Class', description: 'Class management' },
    { name: 'Session', description: 'Exam session management' },
    { name: 'SessionRequest', description: 'Student session join requests' },
    { name: 'SessionParticipant', description: 'Session participant tracking & score publishing' },
    { name: 'Topic', description: 'Exam/Topic management (create, approve, publish)' },
    { name: 'TopicSection', description: 'Topic-Section relationships' },
    { name: 'Section', description: 'Question sections (grouped by skill)' },
    { name: 'Question', description: 'Individual question CRUD' },
    { name: 'QuestionSetQuestion', description: 'Question set membership' },
    { name: 'Part', description: 'Question parts management' },
    { name: 'Grade', description: 'Grading & exam review' },
    { name: 'StudentAnswer', description: 'Student answer submission' },
    { name: 'StudentAnswerDraft', description: 'Draft answer auto-save' },
    { name: 'Files', description: 'File upload/download via MinIO presigned URLs' },
    { name: 'Excel', description: 'Excel import/export for questions' },
    { name: 'Email', description: 'Email notifications' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token obtained from POST /users/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 500 },
          message: { type: 'string', example: 'Internal server error' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          currentPage: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 10 },
          pageCount: { type: 'integer', example: 5 },
          totalItems: { type: 'integer', example: 50 },
        },
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
  apis: ['./Controller/*.js', './models/*.js', './routes/*.js'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
