import { useState, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

const MAX_PHOTOS = 6;

export default function PhotoUpload({ session, photos = [], onChange }) {
  const [cropModal, setCropModal] = useState(null); // { file, objectUrl, index }
  const [cropPos, setCropPos] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeSlot = useRef(null);

  const slots = [...photos, ...Array(MAX_PHOTOS - photos.length).fill(null)];

  const openFilePicker = (index) => {
    activeSlot.current = index;
    fileInputRef.current.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const objectUrl = URL.createObjectURL(file);
    setCropPos({ x: 0, y: 0, scale: 1 });
    setCropModal({ file, objectUrl, index: activeSlot.current });
  };

  // Compress image to blob
  const compressAndCrop = () => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const SIZE = 600;
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      const img = imgRef.current;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      // Scale image to fit square with current crop pos
      const scale = cropPos.scale;
      const baseSize = Math.min(naturalW, naturalH) * scale;
      const drawW = (naturalW / baseSize) * SIZE;
      const drawH = (naturalH / baseSize) * SIZE;
      const offsetX = (SIZE - drawW) / 2 + cropPos.x;
      const offsetY = (SIZE - drawH) / 2 + cropPos.y;

      ctx.fillStyle = "#141210";
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Circular clip
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, SIZE, SIZE);
      ctx.clip();
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      ctx.restore();

      canvas.toBlob((blob) => {
        resolve(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.88);
    });
  };

  const handleSaveCrop = async () => {
    setUploading(true);
    setUploadingIndex(cropModal.index);
    try {
      const file = await compressAndCrop();
      const path = `${session.user.id}/photo_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: "image/jpeg" });
      if (error) { alert("Upload Fehler: " + error.message); return; }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = urlData.publicUrl;
      const newPhotos = [...photos];
      if (cropModal.index < photos.length) {
        newPhotos[cropModal.index] = url; // replace
      } else {
        newPhotos.push(url); // add new
      }
      onChange(newPhotos);
      setCropModal(null);
    } finally {
      setUploading(false);
      setUploadingIndex(null);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  const movePhoto = (from, to) => {
    if (to < 0 || to >= photos.length) return;
    const newPhotos = [...photos];
    [newPhotos[from], newPhotos[to]] = [newPhotos[to], newPhotos[from]];
    onChange(newPhotos);
  };

  // Drag handlers for crop
  const onMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - cropPos.x, y: e.clientY - cropPos.y });
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setCropPos(p => ({ ...p, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
  };
  const onMouseUp = () => setDragging(false);

  // Touch handlers
  const onTouchStart = (e) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - cropPos.x, y: t.clientY - cropPos.y });
  };
  const onTouchMove = (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    setCropPos(p => ({ ...p, x: t.clientX - dragStart.x, y: t.clientY - dragStart.y }));
  };

  return (
    <div>
      {/* Photo Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
        {slots.map((photo, i) => (
          <div key={i} style={{ position: "relative", aspectRatio: "3/4" }}>
            {photo ? (
              <div style={{ width: "100%", height: "100%", borderRadius: "12px", overflow: "hidden", position: "relative", border: "1px solid rgba(242,232,217,0.1)" }}>
                <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}/>
                {/* Main badge */}
                {i === 0 && (
                  <div style={{ position: "absolute", bottom: "6px", left: "6px", background: "rgba(191,92,64,0.9)", borderRadius: "6px", padding: "2px 8px", fontSize: "0.62rem", color: "#fff", fontWeight: "600" }}>
                    Hauptfoto
                  </div>
                )}
                {/* Controls overlay */}
                <div style={{ position: "absolute", top: "6px", right: "6px", display: "flex", gap: "4px" }}>
                  <button onClick={() => openFilePicker(i)}
                    style={{ width: "26px", height: "26px", borderRadius: "50%", background: "rgba(20,18,16,0.8)", border: "1px solid rgba(242,232,217,0.2)", color: "#f2e8d9", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✏️
                  </button>
                  <button onClick={() => removePhoto(i)}
                    style={{ width: "26px", height: "26px", borderRadius: "50%", background: "rgba(191,64,64,0.8)", border: "none", color: "#fff", fontSize: "0.7rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✕
                  </button>
                </div>
                {/* Move arrows */}
                {photos.length > 1 && (
                  <div style={{ position: "absolute", bottom: "6px", right: "6px", display: "flex", gap: "3px" }}>
                    {i > 0 && <button onClick={() => movePhoto(i, i-1)}
                      style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(20,18,16,0.8)", border: "none", color: "#c4b09a", fontSize: "0.65rem", cursor: "pointer" }}>◀</button>}
                    {i < photos.length-1 && <button onClick={() => movePhoto(i, i+1)}
                      style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(20,18,16,0.8)", border: "none", color: "#c4b09a", fontSize: "0.65rem", cursor: "pointer" }}>▶</button>}
                  </div>
                )}
                {uploadingIndex === i && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px" }}>
                    <div style={{ color: "#fff", fontSize: "0.8rem" }}>Lädt...</div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => openFilePicker(i)}
                style={{ width: "100%", height: "100%", borderRadius: "12px", background: "var(--bg3)", border: "2px dashed rgba(242,232,217,0.1)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(191,92,64,0.4)"; e.currentTarget.style.background = "rgba(191,92,64,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(242,232,217,0.1)"; e.currentTarget.style.background = "var(--bg3)"; }}>
                <div style={{ fontSize: i === 0 ? "1.8rem" : "1.3rem" }}>{i === 0 ? "📷" : "+"}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--cream3)" }}>{i === 0 ? "Hauptfoto" : "Foto hinzufügen"}</div>
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ fontSize: "0.72rem", color: "var(--cream3)", marginTop: "8px", textAlign: "center" }}>
        {photos.length}/{MAX_PHOTOS} Fotos · Erstes Foto = Hauptbild · Pfeile zum Umordnen
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect}/>
      {/* Hidden canvas for compression */}
      <canvas ref={canvasRef} style={{ display: "none" }}/>

      {/* CROP MODAL */}
      {cropModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(5,4,3,0.95)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setCropModal(null); }}>
          <div style={{ background: "#1a1612", border: "1px solid rgba(242,232,217,0.1)", borderRadius: "24px", width: "100%", maxWidth: "420px", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.8)" }}>

            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(242,232,217,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: "1.2rem", color: "#f2e8d9", fontWeight: "600" }}>Foto anpassen</div>
                <div style={{ fontSize: "0.72rem", color: "#8a7868", marginTop: "2px" }}>Ziehen zum Positionieren · Schieberegler zum Zoomen</div>
              </div>
              <button onClick={() => setCropModal(null)} style={{ background: "transparent", border: "none", color: "#8a7868", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            {/* Crop Area */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "#0f0d0b", cursor: dragging ? "grabbing" : "grab" }}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}>
              <img
                ref={imgRef}
                src={cropModal.objectUrl}
                draggable={false}
                onLoad={(e) => {
                  // Auto-fit image to fill the crop area
                  const img = e.target;
                  const container = img.parentElement;
                  const cw = container.offsetWidth;
                  const ch = container.offsetHeight;
                  const iw = img.naturalWidth;
                  const ih = img.naturalHeight;
                  const scale = Math.max(cw / iw, ch / ih);
                  setCropPos({ x: 0, y: 0, scale });
                }}
                style={{
                  position: "absolute",
                  left: "50%", top: "50%",
                  width: "auto", height: "auto",
                  maxWidth: "none", maxHeight: "none",
                  transform: `translate(calc(-50% + ${cropPos.x}px), calc(-50% + ${cropPos.y}px)) scale(${cropPos.scale})`,
                  userSelect: "none",
                  pointerEvents: "none",
                  transition: dragging ? "none" : "none",
                  display: "block",
                }}
                alt=""
              />
              {/* Grid overlay */}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "33.33% 33.33%" }}/>
            </div>

            {/* Zoom slider */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(242,232,217,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <span style={{ fontSize: "0.9rem" }}>🔍</span>
                <input type="range" min="0.1" max="5" step="0.05" value={cropPos.scale}
                  onChange={e => setCropPos(p => ({ ...p, scale: parseFloat(e.target.value) }))}
                  style={{ flex: 1 }}/>
                <span style={{ fontSize: "0.75rem", color: "#8a7868", minWidth: "35px" }}>{Math.round(cropPos.scale * 100)}%</span>
              </div>
              <button onClick={() => setCropPos({ x: 0, y: 0, scale: 1 })}
                style={{ width: "100%", padding: "8px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(242,232,217,0.1)", color: "#8a7868", fontFamily: "system-ui", fontSize: "0.78rem", cursor: "pointer", marginBottom: "10px" }}>
                ↺ Zurücksetzen
              </button>
            </div>

            {/* Actions */}
            <div style={{ padding: "0 20px 20px", display: "flex", gap: "10px" }}>
              <button onClick={() => setCropModal(null)}
                style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(242,232,217,0.07)", border: "1px solid rgba(242,232,217,0.1)", color: "#c4b09a", fontFamily: "system-ui", fontSize: "0.88rem", cursor: "pointer" }}>
                Abbrechen
              </button>
              <button onClick={handleSaveCrop} disabled={uploading}
                style={{ flex: 2, padding: "12px", borderRadius: "12px", background: uploading ? "rgba(191,92,64,0.4)" : "#bf5c40", border: "none", color: "#fff", fontFamily: "system-ui", fontSize: "0.88rem", fontWeight: "500", cursor: uploading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                {uploading ? "Wird hochgeladen..." : "✓ Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
