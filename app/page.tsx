"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Map from "@/components/Map";

export interface Track {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  uri: string;
  durationMs: number;
}

export default function Home() {
  const [origin, setOrigin] = useState("New York, NY");
  const [destination, setDestination] = useState("Atlanta, GA");
  const [tripSongs, setTripSongs] = useState<Track[]>([]);

  return (
    <main className="dashboard">
      <Sidebar 
        origin={origin} 
        setOrigin={setOrigin} 
        destination={destination} 
        setDestination={setDestination}
        tripSongs={tripSongs}
        setTripSongs={setTripSongs}
      />
      <section className="map-container">
        <Map 
          origin={origin} 
          destination={destination} 
          tripSongs={tripSongs}
        />
      </section>
    </main>
  );
}
