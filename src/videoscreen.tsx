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

// ---- Video data: Google Drive file IDs, grouped by category ----
type VideoItem = { filename: string; id: string };

function driveThumbnail(id: string) {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w480`;
}
function drivePreviewEmbed(id: string) {
  return `https://drive.google.com/file/d/${id}/preview`;
}

const CATEGORIES: {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  videos: VideoItem[];
}[] = [
  {
    key: "swm-plant",
    label: "Solid Waste Management Plant",
    icon: Factory,
    videos: [
      { filename: "Amrut 2.0 Final HD Video", id: "1ST3lPFoyEXV7m9CnTkyXe519LKhNwZWK" },
      { filename: "Nagar Vikash video 12.03.24", id: "1Q-_utP6Jwa2j7V-TQHY2JkA_t--_GCOZ" },
      { filename: "khana goshala yojana", id: "1goFkSERBNboVfKdMb7t4JUk7-MUQyl9-" },
      { filename: "URTI Video", id: "15tlLiV8Z-VQ4X3DFBApo7RilyFn4Jso1" },
    ],
  },
  {
    key: "mrf",
    label: "MRF",
    icon: Recycle,
    videos: [{ filename: "SBM VIDEO 2024", id: "1-3maxbYQHHGyPZm_u0wSar8wVb8bIGVb" }],
  },
  {
    key: "iec-campaign",
    label: "IEC Campaign",
    icon: Megaphone,
    videos: [
      { filename: "Gauarav Khanna", id: "1b5H4wIvZAZVkf6MxkVum94wgEW7-Wlg-" },
      { filename: "SBM VIDEO 2024", id: "1-3maxbYQHHGyPZm_u0wSar8wVb8bIGVb" },
      { filename: "SHS 2026 Campaign", id: "1qNzHDdAeztfIMsP1KqYBkXf9e2IxYflE" },
      { filename: "26 january 2026 2", id: "1gaDPPw-e_H68yBVuCJaxmsJLGnnQjR7I" },
      { filename: "Har Ghar Tiranga_2", id: "1LZWGzfFGOAgoy8Quvci8oRIfkQC7HlI8" },
      {
        filename: "Naya Sankalp Hai' Swachh Bharat Mission Anthem 2024",
        id: "1uBiSiSjN-2QDzuu-2T3wRnvRHfyti0OR",
      },
      { filename: "SWACHHATA HE SEVA 2026 New video", id: "1h_kLgzdTSVwCJiTrgMlf4sfsRM_421J4" },
    ],
  },
  {
    key: "swachh-saarthi",
    label: "Swachh Saarthi Clubs",
    icon: Users,
    videos: [],
  },
  {
    key: "udd-speech",
    label: "UDD Minister Sir Speech",
    icon: Mic,
    videos: [
      { filename: "MANTRI ji SHS byte", id: "1kK_SagfVtWcpP7XelADt4xwbcnVQvp9K" },
      { filename: "Mantri JI SSclub video 2", id: "1b_2-9AhI0GxQSddRgPS-DC4lx6qyNUWd" },
      { filename: "Mantri ji ULB video", id: "1HQt-9GyXPGcNFiYL3m1_cxQN9asCreFP" },
    ],
  },
  {
    key: "swachh-talks",
    label: "Swachh Talks",
    icon: MessageCircle,
    videos: [
      {
        filename:
          "🧹 एक दिन, एक घंटा, एक साथ! 🇮🇳स्वच्छता ही सेवा 2026 के अंतर्गत 'सेवा ही संकल्प' अभियान के तहत",
        id: "1d92v-KR2BnsNP05peaLjmQQeWqCiA5j-",
      },
      { filename: "Ayodhiya SHS 2026", id: "18AUd1j4Oj3iSZGk5sffwHfe7LEf0r_gJ" },
      { filename: "SAKTI RASOI FILM SUDA", id: "1I6IagZ-qIUqX0MLbCCQDB4mrE8Gronu-" },
      { filename: "SHS 2026 2", id: "1Wp7V61qeOjrq4tAqioy_dIJBITZr0NRP" },
      { filename: "SHS 2026 3", id: "1_Rl992OCX04bNkpOgVOWZ_EsoBWBxpUg" },
      { filename: "SHS 2026 4", id: "1X6sE-HZXSCP2DFpPoHr0S0BSejhVPEMv" },
      { filename: "SHS 2026 5", id: "1ze607MtOlCzg57iC0-sP_-IRLMdk57hi" },
    ],
  },
  {
    key: "plastic-campaign",
    label: "Plastic Campaign",
    icon: Trash2,
    videos: [
      { filename: "SEGREGATE", id: "1S_EgH-FsYXLT7C8TUl1QUiN_DXHnDUIQ" },
      { filename: "SWM Segregation", id: "1YspjE7l7tmesBh9RXSynbJ8vOVBY8WHx" },
    ],
  },
];

type Category = (typeof CATEGORIES)[number];

function VideoThumbnail({
  video,
  onClick,
}: {
  video: VideoItem;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

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
        {!imgFailed ? (
          <img
            src={driveThumbnail(video.id)}
            alt={video.filename}
            onError={() => setImgFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transform: hovered ? "scale(1.05)" : "scale(1)",
              transition: "transform 0.2s ease",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#222",
            }}
          >
            <Play size={30} color="#888" />
          </div>
        )}
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
        {video.filename}
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

      {/* Category popup: Drive thumbnails */}
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
              <p style={{ color: "#8a6a4a" }}>No videos found in this category yet.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "22px",
                }}
              >
                {activeCategory.videos.map((video, i) => (
                  <VideoThumbnail
                    key={`${video.id}-${i}`}
                    video={video}
                    onClick={() => setActiveVideo(video)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen video player via Drive embed */}
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

          <iframe
            key={activeVideo.id}
            src={drivePreviewEmbed(activeVideo.id)}
            allow="autoplay; fullscreen"
            allowFullScreen
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title={activeVideo.filename}
          />
        </div>
      )}
    </div>
  );
}