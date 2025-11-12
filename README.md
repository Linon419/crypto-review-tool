# Crypto Review Tool

A professional cryptocurrency intraday trading chart review and analysis platform built with Next.js, Prisma, and TradingView's lightweight-charts.

## Features

- 🔐 **User Authentication**: Secure login and registration system with NextAuth
- 📊 **Real-time Market Data**: Integration with CCXT for live cryptocurrency price data from Binance
- 📈 **Advanced Charting**: Interactive candlestick charts with customizable timeframes (1m, 5m, 15m, 1h, 4h, 1d)
- 📉 **Technical Indicators**: Support for MA (Moving Average), EMA (Exponential Moving Average), and RSI (Relative Strength Index)
- 🎯 **Support & Resistance Zones**: Mark and visualize key price levels on charts
- 📝 **Watchlist Management**: Create and manage your personalized list of trading pairs
- ⚙️ **Coin Settings**: Configure individual coin parameters and zone markers

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: NextAuth.js
- **Database**: SQLite with Prisma ORM
- **Charting**: TradingView Lightweight Charts
- **Market Data**: CCXT (Cryptocurrency Exchange Trading Library)
- **Technical Indicators**: technicalindicators library
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
cd crypto-review-tool
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
The `.env` file is already configured with:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
```

4. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

## Usage

### 1. Register an Account
- Visit the homepage and click "Register"
- Fill in your email, username, and password
- Submit to create your account

### 2. Sign In
- Click "Sign In" on the homepage
- Enter your credentials
- You'll be redirected to the dashboard

### 3. Manage Watchlist
- Navigate to "Watchlist" from the navbar
- Add trading pairs (e.g., BTCUSDT, ETHUSDT)
- Click "View Chart" on any pair to analyze it

### 4. Analyze Charts
- Go to "Chart" section
- Enter a trading pair (e.g., BTC/USDT)
- Select timeframe (1m, 5m, 15m, 1h, 4h, 1d)
- Toggle technical indicators (MA, EMA, RSI)
- View support/resistance zones if configured

### 5. Configure Settings
- Navigate to "Settings"
- Add coin-specific configurations
- Set support or resistance zones
- Specify zone prices and publish times

## Project Structure

```
crypto-review-tool/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── klines/       # Market data endpoint
│   │   ├── settings/     # Coin settings endpoint
│   │   └── watchlist/    # Watchlist management
│   ├── auth/             # Auth pages (signin, register)
│   ├── dashboard/        # Protected dashboard pages
│   │   ├── chart/        # Chart analysis page
│   │   ├── settings/     # Coin settings page
│   │   └── watchlist/    # Watchlist page
│   ├── layout.tsx        # Root layout with SessionProvider
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── CandlestickChart.tsx
│   ├── Navbar.tsx
│   └── SessionProvider.tsx
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── indicators.ts     # Technical indicators calculations
│   └── prisma.ts         # Prisma client instance
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── dev.db            # SQLite database file
└── types/                # TypeScript type definitions
```

## Database Schema

### User
- id (String, primary key)
- email (String, unique)
- username (String, unique)
- password (String, hashed)
- watchlist (WatchlistItem[])
- coinSettings (CoinSettings[])

### WatchlistItem
- id (String, primary key)
- userId (String, foreign key)
- symbol (String)
- createdAt (DateTime)

### CoinSettings
- id (String, primary key)
- userId (String, foreign key)
- symbol (String)
- publishTime (DateTime)
- zoneType (String: "support" | "resistance")
- zonePrice (Float)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio to view/edit database

## Technical Indicators

### MA (Moving Average)
- Default period: 20
- Color: Blue (#3b82f6)

### EMA (Exponential Moving Average)
- Default period: 20
- Color: Orange (#f59e0b)

### RSI (Relative Strength Index)
- Default period: 14
- Overbought level: 70 (Red line)
- Oversold level: 30 (Green line)
- Color: Purple (#8b5cf6)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Watchlist
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add symbol to watchlist
- `DELETE /api/watchlist?symbol={SYMBOL}` - Remove from watchlist

### Market Data
- `GET /api/klines?symbol={SYMBOL}&timeframe={TF}&limit={LIMIT}` - Get candlestick data

### Settings
- `GET /api/settings?symbol={SYMBOL}` - Get coin settings
- `POST /api/settings` - Create/update coin settings
- `DELETE /api/settings?symbol={SYMBOL}` - Delete coin settings

## Security Considerations

- Passwords are hashed using bcrypt
- JWT-based session management
- API routes protected with NextAuth middleware
- Environment variables for sensitive data

## Future Enhancements

- [ ] Add more technical indicators (MACD, Bollinger Bands)
- [ ] Multiple chart layouts
- [ ] Trading journal/notes
- [ ] Price alerts
- [ ] Export chart images
- [ ] Dark/light theme toggle
- [ ] Mobile responsive improvements
- [ ] Real-time WebSocket data updates

## License

This project is for educational and personal use.

## Support

For issues and questions, please create an issue in the repository.
