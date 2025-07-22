import swaggerAutogen from 'swagger-autogen';
const autogen = swaggerAutogen();

const doc = {
  info: {
    title: 'MindFin API',
    description: 'API documentation for the MindFin',
    version: '1.0.0',
  },
  host: 'localhost:5050',
  basePath: '/api',
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication related endpoints',
    },
  ],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['../routes/*.js'];
autogen(outputFile, endpointsFiles, doc);
