"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import FeedbackModal from "./FeedbackModal";
import { searchTracks } from "@/lib/spotify";
import { Track } from "@/app/page";

type PlaylistSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number | null;
  ownerName: string | null;
};

interface SidebarProps {
  origin: string;
  setOrigin: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  tripSongs: Track[];
  setTripSongs: React.Dispatch<React.SetStateAction<Track[]>>;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  onOpenFeedback: () => void;
}

export default function Sidebar({
  origin,
  setOrigin,
  destination,
  setDestination,
  tripSongs,
  setTripSongs,
  selectedPlaylistId,
  setSelectedPlaylistId,
  onOpenFeedback,
}: SidebarProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [isLoadingPlaylistTracks, setIsLoadingPlaylistTracks] = useState(false);
  const [playlistTracksError, setPlaylistTracksError] = useState<string | null>(
    null,
  );

  // Local state for debounced inputs
  const [localOrigin, setLocalOrigin] = useState(origin);
  const [localDestination, setLocalDestination] = useState(destination);

  // Sync local state if props change externally
  useEffect(() => {
    setLocalOrigin(origin);
  }, [origin]);
  useEffect(() => {
    setLocalDestination(destination);
  }, [destination]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localOrigin !== origin) setOrigin(localOrigin);
    }, 1000);
    return () => clearTimeout(timer);
  }, [localOrigin, origin, setOrigin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localDestination !== destination) setDestination(localDestination);
    }, 1000);
    return () => clearTimeout(timer);
  }, [localDestination, destination, setDestination]);

  useEffect(() => {
    const fetchResults = async () => {
      const accessToken = (session as any)?.accessToken as string | undefined;
      if (searchQuery.length > 2 && accessToken) {
        setIsSearching(true);
        const results = await searchTracks(searchQuery, accessToken);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    };

    const timer = setTimeout(fetchResults, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, session]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("vibedrive:selectedPlaylistId")
        : null;
    if (stored && !selectedPlaylistId) {
      setSelectedPlaylistId(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedPlaylistId)
      window.localStorage.setItem(
        "vibedrive:selectedPlaylistId",
        selectedPlaylistId,
      );
    else window.localStorage.removeItem("vibedrive:selectedPlaylistId");
  }, [selectedPlaylistId]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!session) {
        setPlaylists([]);
        setPlaylistError(null);
        setIsLoadingPlaylists(false);
        return;
      }

      setIsLoadingPlaylists(true);
      setPlaylistError(null);
      try {
        const res = await fetch("/api/spotify/playlists", {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.error || `Failed to load playlists (${res.status})`,
          );
        }
        const data = await res.json();
        setPlaylists(data.items || []);
      } catch (e: any) {
        setPlaylistError(e?.message || "Failed to load playlists");
        setPlaylists([]);
      } finally {
        setIsLoadingPlaylists(false);
      }
    };

    fetchPlaylists();
  }, [session]);

  useEffect(() => {
    if (!session || !selectedPlaylistId) return;

    let cancelled = false;
    const playlistId = selectedPlaylistId;
    const controller = new AbortController();

    const run = async () => {
      setIsLoadingPlaylistTracks(true);
      setPlaylistTracksError(null);

      try {
        const res = await fetch(
          `/api/spotify/playlists/${encodeURIComponent(playlistId)}/tracks`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body?.error || `Failed to load playlist tracks (${res.status})`,
          );
        }
        const data = await res.json();
        if (!cancelled) {
          setTripSongs(Array.isArray(data.items) ? data.items : []);
        }
      } catch (e: any) {
        if (!cancelled && e?.name !== "AbortError") {
          setPlaylistTracksError(
            e?.message || "Failed to load playlist tracks",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPlaylistTracks(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [session, selectedPlaylistId, setTripSongs]);

  const addTrackToTrip = (track: Track) => {
    setTripSongs([...tripSongs, track]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeTrackFromTrip = (index: number) => {
    setTripSongs(tripSongs.filter((_, i) => i !== index));
  };

  const clearTracksFromTrip = () => {
    setTripSongs([]);
    setSelectedPlaylistId(null);
  };

  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div
        className="mobile-handle"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="handle-bar"></div>
      </div>

      <div className="sidebar-header">
        <h1>SoundRoute</h1>

        {session ? (
          <button onClick={() => signOut()} className="auth-button">
            Sign Out
          </button>
        ) : (
          <button
            onClick={() => signIn("spotify")}
            className="auth-button spotify"
          >
            Connect Spotify
          </button>
        )}
      </div>

      <div className="sidebar-content">
   
        {session && (
          <div className="playlist-selection">
            <h3>Playlist</h3>
            {isLoadingPlaylists ? (
              <div className="help-text">Loading your playlists…</div>
            ) : playlistError ? (
              <div className="error-text">{playlistError}</div>
            ) : (
              <div className="playlist-row">
                <select
                  className="playlist-select"
                  value={selectedPlaylistId ?? ""}
                  onChange={(e) =>
                    setSelectedPlaylistId(e.target.value || null)
                  }
                  disabled={isLoadingPlaylistTracks}
                >
                  <option value="">Select a playlist…</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.trackCount != null ? ` (${p.trackCount})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  className="clear-btn"
                  onClick={() => setSelectedPlaylistId(null)}
                  disabled={!selectedPlaylistId}
                >
                  Clear
                </button>
              </div>
            )}
            {isLoadingPlaylistTracks && (
              <div className="help-text" style={{ marginTop: "0.5rem" }}>
                Loading tracks into your route…
              </div>
            )}
            {playlistTracksError && (
              <div className="error-text" style={{ marginTop: "0.5rem" }}>
                {playlistTracksError}
              </div>
            )}
            {!!selectedPlaylistId &&
              !isLoadingPlaylistTracks &&
              !playlistTracksError && (
                <div className="help-text" style={{ marginTop: "0.5rem" }}>
                  Playlist added to your route.
                </div>
              )}
          </div>
        )}

        <div className="route-selection">
          <div className="input-group">
            <label>Origin</label>
            <input
              type="text"
              value={localOrigin}
              onChange={(e) => setLocalOrigin(e.target.value)}
              placeholder="e.g. New York, NY"
            />
          </div>
          <div className="input-group">
            <label>Destination</label>
            <input
              type="text"
              value={localDestination}
              onChange={(e) => setLocalDestination(e.target.value)}
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
            placeholder={
              session ? "Search for a track..." : "Connect Spotify to search"
            }
            disabled={!session}
            className="search-input"
          />

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  className="search-item"
                  onClick={() => addTrackToTrip(track)}
                >
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ margin: 0 }}>Trip Soundtrack</h3>
            {tripSongs.length > 0 && (
              <div onClick={clearTracksFromTrip} className="clear-all-link">
                Clear all
              </div>
            )}
          </div>
          {tripSongs.length === 0 && (
            <div className="empty-state">
              No songs added yet. Start searching!
            </div>
          )}
          {tripSongs.map((track, index) => (
            <div key={`${track.id}-${index}`} className="song-item">
              <img src={track.albumArt} alt={track.name} className="mini-art" />
              <div className="song-info">
                <strong>{track.name}</strong>
                <span>{track.artist}</span>
              </div>
              <button
                className="remove-btn"
                onClick={() => removeTrackFromTrip(index)}
              >
               x
              </button>
            </div>
          ))}
      
        </div>
        <button type="button" className="btn-footer" onClick={onOpenFeedback}>
          See a Bug?
        </button>
      </div>

      <style jsx>{`
        .sidebar {
          width: 350px;
          height: 100vh;
          height: 100dvh;
          background: #121212;
          color: white;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
          z-index: 100;
          transition: transform 0.3s ease-in-out;
        }
        .sidebar-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        .mobile-handle {
          display: none;
          padding: 1rem 0;
          cursor: pointer;
        }
        .handle-bar {
          width: 40px;
          height: 4px;
          background: #333;
          border-radius: 2px;
          margin: 0 auto;
        }
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        h1 {
          font-size: 1.5rem;
          margin: 0;
          color: #1db954;
        }
        .auth-button {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          font-size: 0.8rem;
        }
        .spotify {
          background: #1db954;
          color: black;
        }
        .playlist-selection {
          margin-bottom: 1.5rem;
          background: #1e1e1e;
          padding: 1rem;
          border-radius: 8px;
        }
        .playlist-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .playlist-select {
          width: 100%;
          background: #282828;
          border: 1px solid #333;
          color: white;
          padding: 0.7rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }
        .help-text {
          color: #b3b3b3;
          font-size: 0.85rem;
        }
        .error-text {
          color: #ff4d4d;
          font-size: 0.85rem;
        }
        .clear-btn {
          background: #282828;
          border: 1px solid #333;
          color: #b3b3b3;
          padding: 0.7rem 0.9rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
        }
        .clear-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .clear-all-link {
          font-size: 0.75rem;
          color: #b3b3b3;
          cursor: pointer;
          text-decoration: underline;
        }
        .clear-all-link:hover {
          color: #1db954;
        }
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
          border-color: #1db954;
        }
        .search-section {
          margin-bottom: 1.5rem;
          position: relative;
        }
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
          z-index: 110;
          max-height: 250px;
          overflow-y: auto;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
        }
        .search-item {
          display: flex;
          padding: 0.5rem;
          cursor: pointer;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid #333;
        }
        .search-item:hover {
          background: #333;
        }
        .search-item img {
          width: 40px;
          height: 40px;
          border-radius: 4px;
        }
        .track-info {
          display: flex;
          flex-direction: column;
        }
        .track-info strong {
          font-size: 0.85rem;
        }
        .track-info span {
          font-size: 0.75rem;
          color: #b3b3b3;
        }

        .song-list {
          flex: 1;
        }
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
          border-left: 4px solid #1db954;
        }
        .mini-art {
          width: 32px;
          height: 32px;
          border-radius: 2px;
        }
        .song-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        .song-info strong {
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .song-info span {
          font-size: 0.75rem;
          color: #b3b3b3;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #b3b3b3;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0 0.2rem;
        }
        .remove-btn:hover {
          color: #ff4d4d;
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            height: 80vh;
            max-height: 80vh;
            border-radius: 20px 20px 0 0;
            padding: 0 1.5rem 1.5rem 1.5rem;
            transform: translateY(0);
            box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.5);
          }
          .sidebar.collapsed {
            transform: translateY(calc(80vh - 80px));
          }
          .mobile-handle {
            display: block;
          }
          .sidebar-header {
            margin-bottom: 1rem;
          }
          h1 {
            font-size: 1.2rem;
          }
          .sidebar-content {
            padding-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
