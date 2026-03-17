export async function searchTracks(query: string, accessToken: string) {
  if (!query) return [];

  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Token might be expired, handled by NextAuth refresh or re-auth
      console.error("Spotify API Unauthorized");
    }
    return [];
  }

  const data = await res.json();
  return data.tracks.items.map((track: any) => ({
    id: track.id,
    name: track.name,
    artist: track.artists[0].name,
    albumArt: track.album.images[track.album.images.length - 1]?.url,
    uri: track.uri,
    durationMs: track.duration_ms
  }));
}
