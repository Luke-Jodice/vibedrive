"use client";

import React from 'react';
import { Track } from '@/app/page';

interface VibeTooltipProps {
  track: Track;
  pos: { x: number, y: number };
}

export default function VibeTooltip({ track, pos }: VibeTooltipProps) {
  return (
    <div className="vibe-tooltip" style={{ left: pos.x, top: pos.y }}>
      <img src={track.albumArt} alt={track.name} className="tooltip-art" />
      <div className="tooltip-content">
        <span className="tooltip-label">Now Playing</span>
        <strong className="track-name">{track.name}</strong>
        <span className="artist-name">{track.artist}</span>
      </div>

      <style jsx>{`
        .vibe-tooltip {
          position: fixed;
          background: #282828;
          color: white;
          padding: 0.75rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          pointer-events: none;
          z-index: 1000;
          transform: translate(-50%, -120%);
          border: 1px solid #1DB954;
          min-width: 200px;
          animation: fadeIn 0.15s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -110%); }
          to { opacity: 1; transform: translate(-50%, -120%); }
        }

        .tooltip-art {
          width: 48px;
          height: 48px;
          border-radius: 4px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .tooltip-content {
          display: flex;
          flex-direction: column;
        }

        .tooltip-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          color: #1DB954;
          font-weight: bold;
          letter-spacing: 0.05rem;
          margin-bottom: 0.1rem;
        }

        .track-name {
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }

        .artist-name {
          font-size: 0.75rem;
          color: #b3b3b3;
        }

        /* Triangle pointer */
        .vibe-tooltip::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid #1DB954;
        }
      `}</style>
    </div>
  );
}
