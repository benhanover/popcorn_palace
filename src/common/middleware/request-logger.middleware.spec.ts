// src/common/middleware/request-logger.middleware.spec.ts
import { RequestLoggerMiddleware } from './request-logger.middleware';
import { Logger } from '@nestjs/common';

describe('RequestLoggerMiddleware', () => {
  let middleware: RequestLoggerMiddleware;
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    // Create middleware instance
    middleware = new RequestLoggerMiddleware();

    // Mock request object
    mockRequest = {
      method: 'GET',
      originalUrl: '/test-url',
      ip: '127.0.0.1',
      body: {},
      get: jest.fn().mockReturnValue('Test User Agent'),
    };

    // Mock response object with event listener
    mockResponse = {
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          // Store the callback to call it later
          mockResponse.finishCallback = callback;
        }
      }),
      send: jest.fn(),
      locals: {},
      statusCode: 200,
    };

    // Mock next function
    mockNext = jest.fn();

    // Mock Logger methods
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should call next function', () => {
    middleware.use(mockRequest, mockResponse, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should log incoming request', () => {
    middleware.use(mockRequest, mockResponse, mockNext);
    expect(Logger.prototype.log).toHaveBeenCalledWith(
      expect.stringContaining('GET /test-url - 127.0.0.1'),
    );
  });

  it('should set requestId on request object', () => {
    middleware.use(mockRequest, mockResponse, mockNext);
    expect(mockRequest.requestId).toBeDefined();
  });

  it('should log response when request finishes with 2xx status', () => {
    middleware.use(mockRequest, mockResponse, mockNext);

    // Simulate response finish
    mockResponse.finishCallback();

    // Should log with log level (not warn or error) for 2xx
    expect(Logger.prototype.log).toHaveBeenCalledWith(
      expect.stringContaining('GET /test-url 200'),
    );
  });

  it('should log response with warn level when status is 4xx', () => {
    mockResponse.statusCode = 404;
    middleware.use(mockRequest, mockResponse, mockNext);

    // Simulate response finish
    mockResponse.finishCallback();

    // Should log with warn level for 4xx
    expect(Logger.prototype.warn).toHaveBeenCalledWith(
      expect.stringContaining('GET /test-url 404'),
    );
  });

  it('should log response with error level when status is 5xx', () => {
    mockResponse.statusCode = 500;
    middleware.use(mockRequest, mockResponse, mockNext);

    // Simulate response finish
    mockResponse.finishCallback();

    // Should log with error level for 5xx
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      expect.stringContaining('GET /test-url 500'),
    );
  });

  it('should log request body for POST requests', () => {
    mockRequest.method = 'POST';
    mockRequest.body = { name: 'Test Movie', genre: 'Action' };

    middleware.use(mockRequest, mockResponse, mockNext);

    // Should log request body for POST
    expect(Logger.prototype.debug).toHaveBeenCalledWith(
      expect.stringContaining('Request Body:'),
    );
  });
});