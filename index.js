import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/swagger.js';
import healthRouter from './src/routes/health.js';
import reportsRouter from './src/routes/reports.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Serve Swagger UI at /docs

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the PDF Report Generator API!');
}); // Root route to test the server

app.use('/health', healthRouter); // Health check route

app.use('/reports', reportsRouter); // Use the reports router for routes starting with /reports

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); // Start the server and listen on the specified port
