import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { Express } from 'express';

// Load Swagger JSON document 
const swaggerFile = path.join(__dirname, 'swagger.json');
const swaggerData = fs.readFileSync(swaggerFile, 'utf8');
const swaggerDocument = JSON.parse(swaggerData);

// Configure Swagger 
export const setupSwagger = (app: Express) => {
  // Swagger UI options
  const options = {
    explorer: true
  };

  // Setup Swagger UI route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

  // Serve raw JSON if needed
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
}; 