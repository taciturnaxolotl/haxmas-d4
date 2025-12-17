# ❄️ Snowflake API

A Christmas-themed REST API built with Hono, Drizzle ORM, and SQLite for the Haxmas Day 4 workshop.

## Setup

```bash
# Install dependencies
bun install

# Create database and tables
bun run db:push

# Start dev server
bun run dev
```

Server runs at `http://localhost:3000`

## API Endpoints

### GET `/`

Welcome message

### GET `/api/snowflakes`

List all snowflakes (newest first)

### GET `/api/snowflakes/:id`

Get a specific snowflake

### POST `/api/snowflakes`

Create a new snowflake

```json
{
  "size": 5 // optional, 1-20, random if not provided
}
```

### PATCH `/api/snowflakes/:id/melt`

Mark a snowflake as melted

### DELETE `/api/snowflakes/:id`

Delete a snowflake

## ❄️ ASCII Art Patterns

Each snowflake gets a randomly selected pattern:

1. **Classic Six-Pointed** - Traditional spike design
2. **Diamond** - Geometric diamond shape
3. **X-Cross** - Cross pattern with center
4. **Asterisk Burst** - Star burst with gaps
5. **Crystal** - Crystal lattice structure

The size parameter (1-10) controls how large the ASCII art renders!

## Example Usage

Create snowflakes:

```bash
# Random snowflake
curl -X POST http://localhost:3000/api/snowflakes \
  -H "content-type: application/json" \
  -d '{}'

# Specific size
curl -X POST http://localhost:3000/api/snowflakes \
  -H "content-type: application/json" \
  -d '{"size":10}'
```

List all:

```bash
curl http://localhost:3000/api/snowflakes
```

Melt one:

```bash
curl -X PATCH http://localhost:3000/api/snowflakes/1/melt
```

## Workshop

Built following the [Haxmas Day 4 Workshop](https://workshops.hackclub.com/haxmas/)
