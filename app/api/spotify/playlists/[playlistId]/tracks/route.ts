import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: { name: string }[];
  album: { images: { url: string; width?: number | null; height?: number | null }[] };
};

type SpotifyPlaylistTrackItem = {
  track: SpotifyTrack | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ playlistId: string }> },
) {
  const { playlistId } = await params;
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const maxTracks = 200;
  const tracks: SpotifyTrack[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${encodeURIComponent(
    playlistId,
  )}/tracks?limit=100&fields=items(track(id,name,uri,duration_ms,artists(name),album(images(url,width,height)))),next`;

  while (url && tracks.length < maxTracks) {
    const urlStr: string = url;
    const res: Response = await fetch(urlStr, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "spotify_error", status: res.status, body },
        { status: 502 },
      );
    }

    const data: { items: SpotifyPlaylistTrackItem[]; next: string | null } = await res.json();
    for (const item of data.items || []) {
      if (item?.track) tracks.push(item.track);
      if (tracks.length >= maxTracks) break;
    }
    url = data.next;
  }

  return NextResponse.json({
    items: tracks.slice(0, maxTracks).map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.map((a) => a.name).filter(Boolean).join(", ") ?? "",
      albumArt: t.album?.images?.[t.album.images.length - 1]?.url ?? null,
      uri: t.uri,
      durationMs: t.duration_ms,
    })),
    truncated: tracks.length >= maxTracks,
    maxTracks,
  });
}

