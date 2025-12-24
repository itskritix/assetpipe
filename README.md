# AssetPipe

Open-source platform for company logos and brand assets.

## Features

- Browse and download company logos (SVG + PNG)
- Public API for programmatic access
- Community-driven logo submissions with moderation
- Brand kits with colors, fonts, and guidelines

## Tech Stack

- **Frontend**: Astro + Tailwind CSS
- **API**: Cloudflare Workers + Hono
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2
- **Hosting**: Cloudflare Pages

## Project Structure

```
assetpipe/
├── apps/
│   ├── web/          # Astro website
│   └── api/          # Cloudflare Worker API
├── packages/
│   └── shared/       # Shared types
└── supabase/         # Database migrations
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase CLI
- Wrangler CLI

### Installation

```bash
# Install dependencies
pnpm install

# Set up Supabase locally
supabase start

# Copy environment files
cp apps/web/.env.example apps/web/.env
cp apps/api/.dev.vars.example apps/api/.dev.vars

# Update .env files with your Supabase credentials
```

### Development

```bash
# Start Supabase (if not running)
supabase start

# Start the web app
pnpm dev:web

# Start the API (in another terminal)
pnpm dev:api
```

### Database

```bash
# Apply migrations
pnpm db:migrate

# Reset database (warning: deletes all data)
pnpm db:reset
```

### Deployment

```bash
# Deploy website to Cloudflare Pages
pnpm deploy:web

# Deploy API to Cloudflare Workers
pnpm deploy:api
```

## API Usage

```bash
# List companies
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.assetpipe.com/v1/companies

# Get company logos
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.assetpipe.com/v1/companies/github/logos

# Search companies
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://api.assetpipe.com/v1/search?q=stripe"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

For logo submissions, use the website's submission form.

## License

MIT
