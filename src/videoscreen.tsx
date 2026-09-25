import React, { useState } from "react";
import {
  Factory,
  Recycle,
  Megaphone,
  Users,
  Mic,
  MessageCircle,
  Trash2,
  X,
  Play,
} from "lucide-react";

// Eagerly import every video under src/assets/videos/** as a resolved URL.
// Keys look like: "/src/assets/videos/mrf/SBM VIDEO 2024.mp4"
const videoModules = import.meta.glob("/src/assets/videos/**/*.mp4", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// Group resolved URLs by folder name.
function getVideosForFolder(folder: string) {
  const prefix = `/src/assets/videos/${folder}/`;
  return Object.entries(videoModules)
    .filter(([path]) => path.startsWith(prefix))
    .map(([path, url]) => ({
      filename: decodeURIComponent(path.replace(prefix, "")),
      url,
    }));
}

const CATEGORIES = [
  {
    key: "swm-plant",
    label: "Solid Waste Management Plant",
    folder: "solid-waste-management-plant",
    icon: Factory,
  },
  {
    key: "mrf",
    label: "Material Recovery Facility (MRF)",
    folder: "mrf",
    icon: Recycle,
  },
  {
    key: "iec-campaign",
    label: "IEC Campaign",
    folder: "iec-campaign",
    icon: Megaphone,
  },
  {
    key: "swachh-saarthi",
    label: "Swachh Saarthi Clubs",
    folder: "swachh-saarthi-clubs",
    icon: Users,
  },
  {
    key: "udd-speech",
    label: "UDD Minister Sir Speech",
    folder: "udd-minister-sir-speech",
    icon: Mic,
  },
  {
    key: "swachh-talks",
    label: "Swachh Talks",
    folder: "swachh-talks",
    icon: MessageCircle,
  },
  {
    key: "plastic-campaign",
    label: "Plastic Campaign",
    folder: "plastic-campaign",
    icon: Trash2,
  },
].map((cat) => ({ ...cat, videos: getVideosForFolder(cat.folder) }));

type VideoItem = { filename: string; url: string };
type Category = (typeof CATEGORIES)[number];

function VideoThumbnail({
  video,
  onClick,
}: {
  video: VideoItem;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid #FFCC99",
        background: "#FFF4E6",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: "10px",
          overflow: "hidden",
          background: "#000",
        }}
      >
        <video
          src={video.url}
          muted
          preload="metadata"
          onLoadedMetadata={(e) => {
            try {
              e.currentTarget.currentTime = 0.5;
            } catch {
              /* no-op */
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.2s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: hovered ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.15)",
            transition: "background 0.2s ease",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            }}
          >
            <Play size={22} color="#FF7A00" fill="#FF7A00" />
          </div>
        </div>
      </div>
      <span
        style={{
          fontSize: "0.85rem",
          color: "#5a3a1a",
          wordBreak: "break-word",
          textAlign: "center",
        }}
      >
        {video.filename.replace(/\.mp4$/i, "")}
      </span>
    </button>
  );
}

export default function SwachhBharatVideoHub() {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const closeAll = () => {
    setActiveCategory(null);
    setActiveVideo(null);
  };

  const closeVideoOnly = () => setActiveVideo(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "linear-gradient(160deg, #FF7A00 0%, #FF9933 22%, #FFC266 38%, #ffffff 52%, #ffffff 68%, #d9f2e3 82%, #128807 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "56px 32px",
        boxSizing: "border-box",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "900px",
          height: "900px",
          border: "2px solid rgba(0,0,128,0.08)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ textAlign: "center", marginBottom: "48px", zIndex: 1 }}>
        <div
          style={{
            fontSize: "0.95rem",
            letterSpacing: "3px",
            fontWeight: 700,
            color: "#000080",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Government of Uttar Pradesh
        </div>
        <h1
          style={{
            color: "#7a2e00",
            fontSize: "2.75rem",
            fontWeight: 900,
            margin: 0,
            textShadow: "0 2px 6px rgba(255,255,255,0.8)",
          }}
        >
          Swachh Bharat Media Gallery
        </h1>
        <div
          style={{
            width: "160px",
            height: "4px",
            background: "linear-gradient(90deg, #FF9933, #ffffff, #128807)",
            margin: "18px auto 0",
            borderRadius: "4px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "32px",
          width: "100%",
          maxWidth: "1400px",
          flex: 1,
          zIndex: 1,
        }}
      >
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isHovered = hoveredKey === cat.key;
          const count = cat.videos.length;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat)}
              onMouseEnter={() => setHoveredKey(cat.key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                minHeight: "260px",
                padding: "40px 24px",
                borderRadius: "22px",
                border: isHovered ? "3px solid #128807" : "3px solid #FF9933",
                background: isHovered
                  ? "linear-gradient(160deg, #fff8ef 0%, #ffffff 60%)"
                  : "rgba(255,255,255,0.92)",
                color: "#7a2e00",
                fontWeight: 700,
                fontSize: "1.15rem",
                cursor: "pointer",
                boxShadow: isHovered
                  ? "0 14px 30px rgba(18,136,7,0.28)"
                  : "0 8px 20px rgba(255,153,51,0.3)",
                transform: isHovered ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
                transition: "all 0.2s ease",
                opacity: count === 0 ? 0.55 : 1,
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(160deg, #FFEBD1, #FFD9A0)",
                  boxShadow: "inset 0 0 0 2px rgba(255,153,51,0.4)",
                }}
              >
                <Icon size={38} color="#FF7A00" />
              </div>
              <span style={{ textAlign: "center", lineHeight: 1.3 }}>{cat.label}</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#a05a2c" }}>
                {count} video{count !== 1 ? "s" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category popup: real video previews */}
      {activeCategory && !activeVideo && (
        <div
          onClick={closeAll}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "20px",
              width: "min(1100px, 100%)",
              maxHeight: "88vh",
              overflowY: "auto",
              padding: "36px",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <button
              onClick={closeAll}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={28} color="#7a2e00" />
            </button>

            <h2 style={{ color: "#7a2e00", marginBottom: "24px", fontSize: "1.6rem" }}>
              {activeCategory.label}
            </h2>

            {activeCategory.videos.length === 0 ? (
              <p style={{ color: "#8a6a4a" }}>No videos found in this folder yet.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "22px",
                }}
              >
                {activeCategory.videos.map((video) => (
                  <VideoThumbnail
                    key={video.url}
                    video={video}
                    onClick={() => setActiveVideo(video)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen video player */}
      {activeVideo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={closeVideoOnly}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 2100,
            }}
          >
            <X size={26} color="#fff" />
          </button>

          <video
            key={activeVideo.url}
            src={activeVideo.url}
            controls
            autoPlay
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
}