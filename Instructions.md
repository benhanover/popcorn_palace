# Popcorn Palace Movie Ticket Booking System - Instructions

This document provides instructions on how to set up, build, run, and test the Popcorn Palace Movie Ticket Booking System.

## Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- Docker and Docker Compose for running PostgreSQL

## Setup & Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Setup

Simply rename the example files:

```bash
cp .env.example .env
cp .env.test.example .env.test
```

## Running the PostgreSQL Database

The project uses PostgreSQL as its database. You can start it using Docker Compose:

```bash
# Start the development database
docker compose up -d
```

This will start PostgreSQL on port 5432 with the following credentials:

- Username: popcorn-palace
- Password: popcorn-palace
- Database: popcorn-palace

## Running the Application

### Development Mode

To run the application in development mode with auto-reload:

```bash
npm run start:dev
```

The server will start on port 3000 by default. You can access the APIs at `http://localhost:3000/`.

### Production Mode

To build and run the application in production mode:

```bash
# Build the application
npm run build

# Run the application
npm run start:prod
```

## API Documentation

API documentation is available through Swagger UI at:
`http://localhost:3000/api` when the application is running.

## Testing

### Unit Tests

Run unit tests:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

### End-to-End Tests

The end-to-end tests require a separate test database, which can be started using:

```bash
# Start the test database
npm run start:test-db
```

Then run the e2e tests:

```bash
# Run all e2e tests
npm run test:e2e

# Run specific e2e tests
npm run test:e2e:movies
npm run test:e2e:showtimes
```

To stop the test database after finishing tests:

```bash
npm run stop:test-db
```

### Postman Collection

For easier API testing, a Postman collection is included in this project. To use it:

1. Import the collection file from the project:
   - Open Postman
   - Click "Import" button
   - Select the `Popcorn_Palace_API.postman_collection.json` file from the project directory
2. The collection includes pre-configured requests for all API endpoints

This collection makes it easy to manually test and interact with the API without writing code.

## Project Structure

- `src/` - Source code directory
  - `app.module.ts` - Main application module
  - `main.ts` - Application entry point
  - `movies/` - Movies API implementation
  - `showtimes/` - Showtimes API implementation
  - `bookings/` - Bookings API implementation
  - `common/` - Common utilities, filters, and middleware
  - `database/` - Database configuration
- `test/` - End-to-end tests

## API Endpoints

The application implements the following APIs:

### Movies APIs

- `GET /movies/all` - Get all movies
- `POST /movies` - Add a movie
- `POST /movies/update/{movieTitle}` - Update a movie
- `DELETE /movies/{movieTitle}` - Delete a movie

### Showtimes APIs

- `GET /showtimes/{showtimeId}` - Get showtime by ID
- `POST /showtimes` - Add a showtime
- `POST /showtimes/update/{showtimeId}` - Update a showtime
- `DELETE /showtimes/{showtimeId}` - Delete a showtime

### Bookings APIs

- `POST /bookings` - Book a ticket
