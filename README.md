# Vibedrive 🚗🎵

Vibedrive is a travel planning application that seamlessly integrates your Spotify playlists with Google Maps. It visualizes your road trip by mapping each song to specific segments of your route, ensuring your "vibe" is perfectly timed for the journey.

## Features

- **Route Planning:** Input origin and destination to calculate and visualize your driving route.
- **Spotify Integration:** Securely sign in with your Spotify account to access your library and playlists.
- **Dynamic Vibe Mapping:** Tracks are automatically distributed along your route based on their duration and the estimated travel time.
- **Interactive Map:** A dark-themed Google Map shows your journey, with colored segments representing different tracks. Hover over segments to see track details.
- **Track Management:** Search for and add songs to your trip's "vibe list."

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) with Spotify Provider
- **Mapping:** [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api)
- **Styling:** Vanilla CSS (Modern dashboard layout)

## Getting Started

### Prerequisites

- A Spotify Developer account to create an app and get API credentials.
- A Google Cloud Project with the Maps JavaScript API, Directions API, and Geometry Library enabled.

### Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
# Spotify Auth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/vibedrive.git
   cd vibedrive
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable React components (Map, Sidebar, etc.).
- `lib/`: Utility functions and shared configurations (Auth options, Spotify API helpers).
- `public/`: Static assets.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Google Maps Platform](https://developers.google.com/maps/documentation/javascript/overview)
