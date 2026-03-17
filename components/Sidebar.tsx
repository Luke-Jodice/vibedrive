"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import { searchTracks } from "@/lib/spotify";
import { Track } from "@/app/page";

interface SidebarProps {
  origin: string;
  setOrigin: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  tripSongs: Track[];
  setTripSongs: React.Dispatch<React.SetStateAction<Track[]>>;
}

export default function Sidebar({ 
  origin, setOrigin, destination, setDestination, 
  tripSongs, setTripSongs
}: SidebarProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length > 2 && session?.accessToken) {
        setIsSearching(true);
        const results = await searchTracks(searchQuery, session.accessToken as string);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    };

    const timer = setTimeout(fetchResults, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, session]);

  const addTrackToTrip = (track: Track) => {
    setTripSongs([...tripSongs, track]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeTrackFromTrip = (index: number) => {
    setTripSongs(tripSongs.filter((_, i) => i !== index));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Vibedrive</h1>
        {session ? (
          <button onClick={() => signOut()} className="auth-button">Sign Out</button>
        ) : (
          <button onClick={() => signIn('spotify')} className="auth-button spotify">Connect Spotify</button>
        )}
      </div>

      <div className="route-selection">
        <div className="input-group">
          <label>Origin</label>
          <input 
            type="text" 
            value={origin} 
            onChange={(e) => setOrigin(e.target.value)} 
            placeholder="e.g. New York, NY"
          />
        </div>
        <div className="input-group">
          <label>Destination</label>
          <input 
            type="text" 
            value={destination} 
            onChange={(e) => setDestination(e.target.value)} 
            placeholder="e.g. Atlanta, GA"
          />
        </div>
      </div>

      <div className="search-section">
        <h3>Add Music</h3>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={session ? "Search for a track..." : "Connect Spotify to search"}
          disabled={!session}
          className="search-input"
        />
        
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(track => (
              <div key={track.id} className="search-item" onClick={() => addTrackToTrip(track)}>
                <img src={track.albumArt} alt={track.name} />
                <div className="track-info">
                  <strong>{track.name}</strong>
                  <span>{track.artist}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="song-list">
        <h3>Trip Soundtrack</h3>
        {tripSongs.length === 0 && (
          <div className="empty-state">No songs added yet. Start searching!</div>
        )}
        {tripSongs.map((track, index) => (
          <div key={`${track.id}-${index}`} className="song-item">
            <img src={track.albumArt} alt={track.name} className="mini-art" />
            <div className="song-info">
              <strong>{track.name}</strong>
              <span>{track.artist}</span>
            </div>
            <button className="remove-btn" onClick={() => removeTrackFromTrip(index)}>×</button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .sidebar {
          width: 350px;
          height: 100vh;
          background: #121212;
          color: white;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          box-shadow: 2px 0 10px rgba(0,0,0,0.5);
          z-index: 2;
        }
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        h1 { font-size: 1.5rem; margin: 0; color: #1DB954; }
        .auth-button {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          font-size: 0.8rem;
        }
        .spotify { background: #1DB954; color: black; }
        .route-selection {
          margin-bottom: 1.5rem;
          background: #1e1e1e;
          padding: 1rem;
          border-radius: 8px;
        }
        .input-group {
          margin-bottom: 1rem;
        }
        .input-group label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #b3b3b3;
          margin-bottom: 0.4rem;
          font-weight: bold;
        }
        .input-group input {
          width: 100%;
          background: #282828;
          border: 1px solid #333;
          color: white;
          padding: 0.6rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        .input-group input:focus {
          outline: none;
          border-color: #1DB954;
        }
        .search-section { margin-bottom: 1.5rem; position: relative; }
        .search-input {
          width: 100%;
          background: #282828;
          border: 1px solid #333;
          color: white;
          padding: 0.8rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #282828;
          border: 1px solid #333;
          border-radius: 0 0 8px 8px;
          z-index: 10;
          max-height: 250px;
          overflow-y: auto;
          box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        }
        .search-item {
          display: flex;
          padding: 0.5rem;
          cursor: pointer;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid #333;
        }
        .search-item:hover { background: #333; }
        .search-item img { width: 40px; height: 40px; border-radius: 4px; }
        .track-info { display: flex; flex-direction: column; }
        .track-info strong { font-size: 0.85rem; }
        .track-info span { font-size: 0.75rem; color: #b3b3b3; }
        
        .song-list { flex: 1; overflow-y: auto; }
        .empty-state {
          color: #b3b3b3;
          font-size: 0.8rem;
          text-align: center;
          padding: 2rem 0;
          font-style: italic;
        }
        .song-item {
          padding: 0.75rem;
          background: #1e1e1e;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-left: 4px solid #1DB954;
        }
        .mini-art { width: 32px; height: 32px; border-radius: 2px; }
        .song-info { display: flex; flex-direction: column; flex: 1; }
        .song-info strong { font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
        .song-info span { font-size: 0.75rem; color: #b3b3b3; }
        
        .remove-btn {
          background: none;
          border: none;
          color: #b3b3b3;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0 0.2rem;
        }
        .remove-btn:hover { color: #ff4d4d; }
      `}</style>
    </div>
  );
}
