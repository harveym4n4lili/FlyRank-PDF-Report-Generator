import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "PDF Report Generator API",
      version: "0.1.0",
      description:
        "Generates PDF reports from SQLite data and serves them by link. Built with Express and documented with Swagger",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: 'Development server'
      },
    ],
  },
  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);
