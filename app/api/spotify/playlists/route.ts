import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

type SpotifyPlaylistItem = {
  id: string;
  name: string;
  images?: { url: string; width?: number | null; height?: number | null }[];
  tracks?: { total: number };
  owner?: { display_name?: string };
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const playlists: SpotifyPlaylistItem[] = [];
  let url: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";

  while (url) {
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

    const data: { items: SpotifyPlaylistItem[]; next: string | null } = await res.json();
    playlists.push(...(data.items || []));
    url = data.next;
  }

  return NextResponse.json({
    items: playlists.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.images?.[0]?.url ?? null,
      trackCount: p.tracks?.total ?? null,
      ownerName: p.owner?.display_name ?? null,
    })),
  });
}

