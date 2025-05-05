import morgan from 'morgan';
import { Request, Response } from 'express';
import colors from 'colors';
import moment from 'moment';

// Configure colors for console output
colors.enable();

// Custom token for timestamp with formatting
morgan.token('timestamp', () => {
  return moment().format('YYYY-MM-DD HH:mm:ss');
});

// Custom token for colored HTTP method
morgan.token('method-colored', (req: Request) => {
  const method = req.method;
  switch (method) {
    case 'GET':
      return colors.green(method);
    case 'POST':
      return colors.yellow(method);
    case 'PUT':
      return colors.blue(method);
    case 'DELETE':
      return colors.red(method);
    case 'PATCH':
      return colors.magenta(method);
    default:
      return colors.white(method);
  }
});

// Custom token for colored status code
morgan.token('status-colored', (req: Request, res: Response) => {
  const status = res.statusCode;
  if (status >= 500) return colors.red(status.toString());
  if (status >= 400) return colors.yellow(status.toString());
  if (status >= 300) return colors.cyan(status.toString());
  if (status >= 200) return colors.green(status.toString());
  return colors.white(status.toString());
});

// Custom token for response time with color based on duration
morgan.token('response-time-colored', (req: Request, res: Response) => {
  // @ts-ignore - morgan types don't properly expose the responseTime
  const time = morgan['response-time'](req, res);
  const responseTime = parseFloat(time);
  
  if (responseTime >= 1000) return colors.red(`${responseTime}ms`);
  if (responseTime >= 500) return colors.yellow(`${responseTime}ms`);
  if (responseTime >= 100) return colors.cyan(`${responseTime}ms`);
  return colors.green(`${responseTime}ms`);
});

// Create custom format similar to Nest.js logger
const nestFormat = (tokens: morgan.TokenIndexer<Request, Response>, req: Request, res: Response) => {
  return [
    `[${tokens['timestamp'](req, res)}]`,
    `[${tokens['method-colored'](req, res)}]`,
    tokens.url(req, res),
    `${tokens['status-colored'](req, res)}`,
    `- ${tokens['response-time-colored'](req, res, 2)}`
  ].join(' ');
};

// Skip function to conditionally log based on request type
const skipHealthChecks = (req: Request) => {
  // Skip logging for health checks or other frequent endpoints
  return req.url.includes('/health') || req.url.includes('/metrics');
};

// Create logger middleware
export const logger = morgan(nestFormat, {
  skip: skipHealthChecks
});

// Create development logger with more verbose output
export const developmentLogger = morgan(nestFormat, {
  skip: skipHealthChecks
});

// Default export based on environment
export default process.env.NODE_ENV === 'production' ? logger : developmentLogger; 