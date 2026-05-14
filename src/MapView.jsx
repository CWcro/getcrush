import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const av = (p) => p?.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${p?.id}`;
const EVENT_EMOJIS = ["📍","🎉","🎸","🍕","🏃","☕","🍺","🎬","🏋️","🎮","🌳","🎨","🎤","🎵","❤️"];
const CAT_COLORS = { "Treffen":"#bf5c40","Party":"#c99840","Sport":"#4a9e72","Essen":"#d97a5c","Sonstiges":"#8a7868" };

export default function MapView({ session, me }) {
  const mapRef = useRef(null);
  const L = useRef(null);
  const mapInst = useRef(null);
  const markers = useRef({});

  const [mapReady, setMapReady] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [liveUsers, setLiveUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [nearbyAlert, setNearbyAlert] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [alfredPanel, setAlfredPanel] = useState(true);
  const [alfredSuggestions, setAlfredSuggestions] = useState([]);
  const [showPanel, setShowPanel] = useState("live"); // live | myevents

  // Create event
  const [showCreate, setShowCreate] = useState(false);
  const [clickLatLng, setClickLatLng] = useState(null);
  const [clickAddress, setClickAddress] = useState("");
  const [evTitle, setEvTitle] = useState("");
  const [evDesc, setEvDesc] = useState("");
  const [evEmoji, setEvEmoji] = useState("📍");
  const [evDate, setEvDate] = useState("");
  const [evCat, setEvCat] = useState("Sonstiges");
  const [creating, setCreating] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalResults, setModalResults] = useState([]);
  const [modalSearching, setModalSearching] = useState(false);

  // Address search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const watchId = useRef(null);
  const rtChannel = useRef(null);
  const mapInitialized = useRef(false);

  // ── LOAD LEAFLET ──
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const l = document.createElement("link");
      l.id = "leaflet-css"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    if (window.L) { L.current = window.L; initMap(); return; }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => { L.current = window.L; initMap(); };
    document.head.appendChild(s);
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || mapInst.current || mapInitialized.current) return;
    mapInitialized.current = true;
    const Lf = L.current;
    mapInst.current = Lf.map(mapRef.current, { zoomControl: false }).setView([52.52, 13.405], 12);
    Lf.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO", maxZoom: 19
    }).addTo(mapInst.current);
    Lf.control.zoom({ position: "bottomright" }).addTo(mapInst.current);

    mapInst.current.on("click", async (e) => {
      setClickLatLng(e.latlng);
      setClickAddress("Adresse wird geladen...");
      setShowCreate(true);
      // Reverse geocode
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`);
        const data = await res.json();
        setClickAddress(data.display_name?.split(",").slice(0,3).join(", ") || "Unbekannte Adresse");
      } catch { setClickAddress("Adresse nicht verfügbar"); }
    });

    setMapReady(true);
    loadData();
    subscribeRealtime();
  };

  const loadData = async () => {
    // Load events
    const { data: evData } = await supabase.from("events").select("*, profiles(name,avatar_url)").eq("is_public", true);
    if (evData) {
      setEvents(evData);
      setMyEvents(evData.filter(e => e.created_by === session?.user?.id));
      evData.forEach(e => addEventPin(e));
    }
    // Load live users
    const { data: locData } = await supabase.from("user_locations").select("*, profiles(name,avatar_url,id)").eq("is_live", true);
    if (locData) {
      const others = locData.filter(u => u.user_id !== session?.user?.id);
      setLiveUsers(others);
      others.forEach(u => addUserPin(u));
    }
  };

  const subscribeRealtime = () => {
    if (rtChannel.current) { supabase.removeChannel(rtChannel.current); rtChannel.current = null; }
    rtChannel.current = supabase.channel("map-rt-" + Date.now())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "events" }, async (p) => {
        // Skip if already added optimistically
        setEvents(prev => {
          if (prev.find(e => e.id === p.new.id)) return prev;
          // New event from another user — fetch profile and add
          supabase.from("profiles").select("name,avatar_url").eq("id", p.new.created_by).single().then(({ data: prof }) => {
            const ev = { ...p.new, profiles: prof };
            setEvents(pr => pr.find(e => e.id === ev.id) ? pr : [...pr, ev]);
          });
          return prev;
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "events" }, (p) => {
        setEvents(prev => prev.filter(e => e.id !== p.old.id));
        setMyEvents(prev => prev.filter(e => e.id !== p.old.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_locations" }, async () => {
        const { data: locData } = await supabase.from("user_locations").select("*, profiles(name,avatar_url,id)").eq("is_live", true);
        if (locData) {
          const others = locData.filter(u => u.user_id !== session?.user?.id);
          setLiveUsers(others);
        }
      })
      .subscribe();
  };

  const addEventPin = (ev) => {
    if (!L.current || !mapInst.current) return;
    const key = "ev-" + ev.id;
    removeMarker(key);
    const isMine = ev.created_by === session?.user?.id;
    const color = CAT_COLORS[ev.category] || "#bf5c40";
    const icon = L.current.divIcon({
      className: "",
      html: `<div style="position:relative">
        <div style="width:42px;height:42px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid ${isMine?"#fff":"rgba(255,255,255,0.25)"};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.5);cursor:pointer">
          <span style="transform:rotate(45deg);font-size:1.1rem">${ev.emoji||"📍"}</span>
        </div>
        ${isMine ? `<div style="position:absolute;top:-6px;right:-6px;width:14px;height:14px;background:#fff;border-radius:50%;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:0.5rem">👤</div>` : ""}
      </div>`,
      iconSize: [42, 42], iconAnchor: [21, 42]
    });
    const dateStr = ev.event_date ? new Date(ev.event_date).toLocaleString("de-DE",{dateStyle:"short",timeStyle:"short"}) : null;
    const m = L.current.marker([ev.lat, ev.lng], { icon })
      .addTo(mapInst.current)
      .bindPopup(`
        <div style="font-family:system-ui;min-width:190px;padding:4px">
          <div style="font-size:1.05rem;font-weight:600;margin-bottom:4px">${ev.emoji} ${ev.title}</div>
          ${ev.description ? `<div style="font-size:0.8rem;color:#aaa;margin-bottom:6px">${ev.description}</div>` : ""}
          ${dateStr ? `<div style="font-size:0.76rem;color:#c4b09a">📅 ${dateStr}</div>` : ""}
          <div style="font-size:0.72rem;color:#666;margin-top:5px;border-top:1px solid #333;padding-top:5px">von ${ev.profiles?.name||"?"} · ${ev.category||"Sonstiges"}</div>
        </div>
      `);
    m.on("click", () => setSelectedEvent(ev));
    markers.current[key] = m;
  };

  // Re-render markers whenever events state changes
  useEffect(() => {
    if (!mapInst.current || !L.current) return;
    // Remove all event markers
    Object.keys(markers.current).forEach(key => {
      if (key.startsWith("ev-")) {
        mapInst.current.removeLayer(markers.current[key]);
        delete markers.current[key];
      }
    });
    // Re-add all current events
    events.forEach(e => addEventPin(e));
  }, [events]);

  // Re-render user markers when liveUsers changes
  useEffect(() => {
    if (!mapInst.current || !L.current) return;
    Object.keys(markers.current).forEach(key => {
      if (key.startsWith("u-")) {
        mapInst.current.removeLayer(markers.current[key]);
        delete markers.current[key];
      }
    });
    liveUsers.forEach(u => addUserPin(u));
  }, [liveUsers]);

  // Generate Alfred suggestions when events/users change
  useEffect(() => {
    const suggestions = [];
    if (events.length > 0) {
      const next = events.find(e => e.event_date && new Date(e.event_date) > new Date());
      if (next) suggestions.push({ icon: next.emoji, text: `"${next.title}" findet bald statt — schau mal vorbei!`, action: () => mapInst.current?.setView([next.lat, next.lng], 16) });
    }
    if (liveUsers.length > 0) {
      suggestions.push({ icon: "💘", text: `${liveUsers[0].profiles?.name} ist gerade live in der Nähe!`, action: () => mapInst.current?.setView([liveUsers[0].lat, liveUsers[0].lng], 16) });
    }
    suggestions.push({ icon: "📍", text: "Klick auf die Karte um ein spontanes Treffen zu pinnen!", action: null });
    setAlfredSuggestions(suggestions);
  }, [events, liveUsers]);

  const addUserPin = (u) => {
    if (!L.current || !mapInst.current) return;
    const key = "u-" + u.user_id;
    removeMarker(key);
    const icon = L.current.divIcon({
      className: "",
      html: `<div style="width:44px;height:44px;border-radius:50%;border:3px solid #bf5c40;overflow:hidden;box-shadow:0 0 0 3px rgba(191,92,64,0.3),0 4px 16px rgba(0,0,0,0.5)">
        <img src="${av(u.profiles)}" style="width:100%;height:100%;object-fit:cover"/>
      </div>`,
      iconSize: [44, 44], iconAnchor: [22, 22]
    });
    const mins = Math.round((Date.now() - new Date(u.updated_at)) / 60000);
    const m = L.current.marker([u.lat, u.lng], { icon })
      .addTo(mapInst.current)
      .bindPopup(`
        <div style="text-align:center;font-family:system-ui;padding:4px">
          <img src="${av(u.profiles)}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid #bf5c40;margin-bottom:6px"/>
          <div style="font-size:0.95rem;font-weight:600">${u.profiles?.name||"?"}</div>
          <div style="font-size:0.72rem;color:#4a9e72;margin-top:3px">● Live · vor ${mins < 1 ? "< 1" : mins} Min</div>
        </div>
      `);
    markers.current[key] = m;
  };

  const addMyPin = (lat, lng) => {
    if (!L.current || !mapInst.current) return;
    removeMarker("me");
    const icon = L.current.divIcon({
      className: "",
      html: `<div style="position:relative">
        <div style="width:50px;height:50px;border-radius:50%;border:3px solid #d97a5c;overflow:hidden;box-shadow:0 0 0 5px rgba(191,92,64,0.25),0 4px 20px rgba(0,0,0,0.6)">
          <img src="${av(me)}" style="width:100%;height:100%;object-fit:cover"/>
        </div>
        <div style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;background:#bf5c40;border-radius:50%;border:2px solid #0f0d0b;display:flex;align-items:center;justify-content:center;font-size:0.55rem;color:white;font-weight:700">DU</div>
      </div>`,
      iconSize: [50, 50], iconAnchor: [25, 25]
    });
    markers.current["me"] = L.current.marker([lat, lng], { icon }).addTo(mapInst.current)
      .bindPopup(`<div style="text-align:center;padding:4px;font-family:system-ui"><b>Du bist hier 📍</b><br><small style="color:#888">Live aktiv</small></div>`);
  };

  const removeMarker = (key) => {
    if (markers.current[key] && mapInst.current) {
      mapInst.current.removeLayer(markers.current[key]);
      delete markers.current[key];
    }
  };

  // ── DELETE EVENT ──
  const deleteEvent = async (id) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (!error) {
      // Remove from state immediately
      setEvents(prev => prev.filter(e => e.id !== id));
      setMyEvents(prev => prev.filter(e => e.id !== id));
      // Remove marker from map immediately
      removeMarker("ev-" + id);
      setSelectedEvent(null);
    } else {
      alert("Fehler beim Löschen: " + error.message);
    }
  };

  // ── LIVE TOGGLE ──
  const toggleLive = async () => {
    if (isLive) {
      setIsLive(false);
      if (watchId.current) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; }
      await supabase.from("user_locations").upsert({ user_id: session.user.id, lat: 0, lng: 0, is_live: false });
      removeMarker("me");
      return;
    }

    if (!navigator.geolocation) { alert("Dein Browser unterstützt keine Standortfreigabe."); return; }

    // Test permission first
    try {
      const perm = await navigator.permissions.query({ name: "geolocation" });
      if (perm.state === "denied") {
        alert("Standort-Berechtigung verweigert. Bitte in den Browser-Einstellungen aktivieren.");
        return;
      }
    } catch (e) { /* permissions API not supported, continue anyway */ }

    // Try low accuracy first (fast), then high accuracy
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        console.log("✅ Standort erhalten:", lat, lng, "Genauigkeit:", accuracy + "m");
        setIsLive(true);
        addMyPin(lat, lng);
        mapInst.current?.setView([lat, lng], 15);

        const { error: upsertErr } = await supabase.from("user_locations").upsert({
          user_id: session.user.id, lat, lng, accuracy, is_live: true
        }, { onConflict: "user_id" });

        if (upsertErr) {
          console.error("❌ Supabase upsert Fehler:", upsertErr.message);
          alert("Standort konnte nicht gespeichert werden: " + upsertErr.message);
          setIsLive(false);
          return;
        }
        console.log("✅ Standort in Supabase gespeichert");

        try {
          const { data: nb } = await supabase.rpc("nearby_users", { my_lat: lat, my_lng: lng, radius_meters: 300 });
          if (nb?.length) setNearbyAlert(nb[0]);
        } catch (e) { console.log("nearby_users RPC:", e.message); }

        watchId.current = navigator.geolocation.watchPosition(
          async (p) => {
            const { latitude: la, longitude: lo, accuracy: ac } = p.coords;
            addMyPin(la, lo);
            await supabase.from("user_locations").upsert({
              user_id: session.user.id, lat: la, lng: lo, accuracy: ac, is_live: true
            }, { onConflict: "user_id" });
          },
          (err) => console.warn("Watch error:", err.message),
          { enableHighAccuracy: false, maximumAge: 30000, timeout: 30000 }
        );
      },
      (err) => {
        console.error("❌ Geolocation Fehler Code:", err.code, err.message);
        const msgs = {
          1: "Standort verweigert — bitte oben links auf 🔒 klicken → Standort → Erlauben.",
          2: "Standort nicht verfügbar.",
          3: "Zeitüberschreitung — bitte nochmal versuchen."
        };
        alert(msgs[err.code] || err.message);
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
    );
  };

  // ── ADDRESS SEARCH ──
  const searchAddress = async (q) => {
    if (q.length < 3) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`);
      const data = await res.json();
      setSearchResults(data);
    } catch { setSearchResults([]); }
    setSearching(false);
  };

  const selectAddress = async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSearchQuery(result.display_name.split(",").slice(0,2).join(", "));
    setSearchResults([]);
    mapInst.current?.setView([lat, lng], 16);
    // Auto-open create event at this location
    setClickLatLng({ lat, lng });
    setClickAddress(result.display_name.split(",").slice(0,3).join(", "));
    setShowCreate(true);
  };

  // ── MODAL ADDRESS SEARCH ──
  const searchInModal = async (q) => {
    if (q.length < 3) { setModalResults([]); return; }
    setModalSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setModalResults(data);
    } catch { setModalResults([]); }
    setModalSearching(false);
  };

  const selectModalAddress = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const addr = result.display_name.split(",").slice(0,3).join(", ");
    setClickLatLng({ lat, lng });
    setClickAddress(addr);
    setModalSearch(addr);
    setModalResults([]);
    mapInst.current?.setView([lat, lng], 16);
    // Move the click marker
    if (markers.current["click"]) mapInst.current.removeLayer(markers.current["click"]);
    if (L.current) {
      markers.current["click"] = L.current.marker([lat, lng], {
        icon: L.current.divIcon({ className:"", html:`<div style="width:16px;height:16px;background:#bf5c40;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`, iconSize:[16,16], iconAnchor:[8,8] })
      }).addTo(mapInst.current);
    }
  };

  // ── CREATE EVENT ──
  const createEvent = async () => {
    if (!evTitle.trim() || !clickLatLng) return;
    setCreating(true);
    const { data: newEvent, error } = await supabase.from("events").insert({
      created_by: session.user.id,
      title: evTitle, description: evDesc, emoji: evEmoji,
      lat: clickLatLng.lat, lng: clickLatLng.lng,
      event_date: evDate || null, category: evCat, is_public: true,
    }).select("*").single();
    setCreating(false);
    if (!error && newEvent) {
      // Immediately show pin — don't wait for Realtime
      const evWithProfile = { ...newEvent, profiles: { name: me?.name, avatar_url: me?.avatar_url } };
      setEvents(prev => [...prev, evWithProfile]);
      setMyEvents(prev => [...prev, evWithProfile]);
      addEventPin(evWithProfile);
      setShowCreate(false);
      setEvTitle(""); setEvDesc(""); setEvEmoji("📍"); setEvDate(""); setEvCat("Sonstiges");
      setSearchQuery(""); setModalSearch(""); setModalResults([]);
      if (markers.current["click"]) { mapInst.current.removeLayer(markers.current["click"]); delete markers.current["click"]; }
    } else if (error) {
      alert("Fehler beim Erstellen: " + error.message);
    }
  };

  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }}/>

      <style>{`
        .leaflet-popup-content-wrapper{background:#1a1612;border:1px solid rgba(242,232,217,0.12);color:#f2e8d9;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.7)}
        .leaflet-popup-tip{background:#1a1612}
        .leaflet-popup-close-button{color:#8a7868!important;font-size:1.1rem!important}
        .leaflet-control-zoom a{background:#1a1612!important;color:#c4b09a!important;border-color:rgba(242,232,217,0.1)!important}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popUp{from{opacity:0;transform:scale(0.88) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) scale(0.9)}to{opacity:1;transform:translateX(-50%) scale(1)}}
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ position:"absolute", top:10, left:8, right:8, zIndex:1000, display:"flex", flexDirection:"column", gap:"6px" }}>
        {/* Zeile 1: Suche + Live */}
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          <div style={{ position:"relative", flex:1 }}>
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); searchAddress(e.target.value); }}
              placeholder="🔍 Ort suchen..."
              style={{ width:"100%", padding:"9px 14px", borderRadius:"50px", background:"rgba(20,18,16,0.95)", backdropFilter:"blur(12px)", border:"1px solid rgba(242,232,217,0.15)", color:"#f2e8d9", fontFamily:"system-ui", fontSize:"0.8rem", outline:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.4)", boxSizing:"border-box" }}
            />
            {searchResults.length > 0 && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#1a1612", border:"1px solid rgba(242,232,217,0.12)", borderRadius:"12px", overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.6)", zIndex:100 }}>
                {searchResults.map((r, i) => (
                  <div key={i} onClick={() => selectAddress(r)} style={{ padding:"9px 14px", cursor:"pointer", borderBottom:"1px solid rgba(242,232,217,0.04)", fontSize:"0.78rem", color:"#c4b09a" }}>
                    📍 {r.display_name.split(",").slice(0,2).join(", ")}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={toggleLive} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"9px 12px", borderRadius:"50px", border:`1px solid ${isLive?"#bf5c40":"rgba(242,232,217,0.15)"}`, cursor:"pointer", fontFamily:"system-ui", fontSize:"0.78rem", fontWeight:"600", background:isLive?"#bf5c40":"rgba(20,18,16,0.95)", color:isLive?"#fff":"#c4b09a", backdropFilter:"blur(12px)", boxShadow:"0 4px 20px rgba(0,0,0,0.4)", whiteSpace:"nowrap", flexShrink:0 }}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:isLive?"#fff":"#8a7868", animation:isLive?"pulse 1.5s infinite":"none", flexShrink:0 }}/>
            {isLive ? "Live" : "Live"}
          </button>
        </div>
        {/* Zeile 2: Stats */}
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          <div style={{ padding:"6px 12px", borderRadius:"50px", background:"rgba(20,18,16,0.92)", backdropFilter:"blur(12px)", border:"1px solid rgba(242,232,217,0.1)", color:"#c4b09a", fontSize:"0.74rem", boxShadow:"0 4px 20px rgba(0,0,0,0.4)", display:"flex", gap:"10px" }}>
            <span>🟢 {liveUsers.length} live</span>
            <span>📍 {events.length} Events</span>
          </div>
          {!showCreate && (
            <div style={{ padding:"6px 12px", borderRadius:"50px", background:"rgba(20,18,16,0.85)", border:"1px solid rgba(242,232,217,0.07)", color:"#8a7868", fontSize:"0.72rem", backdropFilter:"blur(8px)" }}>
              Tippen → Event pinnen
            </div>
          )}
        </div>
      </div>

      {/* ── SIDE PANEL ── */}
      <div style={{ position:"absolute", top:90, right:8, zIndex:1000, width:"min(200px, 45vw)", background:"rgba(20,18,16,0.92)", backdropFilter:"blur(12px)", border:"1px solid rgba(242,232,217,0.1)", borderRadius:"16px", overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(242,232,217,0.07)" }}>
          {["live","myevents"].map(t => (
            <button key={t} onClick={() => setShowPanel(t)} style={{ flex:1, padding:"10px 0", background:showPanel===t?"rgba(191,92,64,0.12)":"transparent", border:"none", color:showPanel===t?"#d97a5c":"#8a7868", fontSize:"0.72rem", cursor:"pointer", fontWeight:showPanel===t?"600":"400", fontFamily:"system-ui" }}>
              {t==="live" ? `🟢 Live (${liveUsers.length})` : `📍 Meine (${myEvents.length})`}
            </button>
          ))}
        </div>

        {showPanel === "live" && (
          <div style={{ maxHeight:"300px", overflowY:"auto" }}>
            {liveUsers.length === 0
              ? <div style={{ padding:"16px", textAlign:"center", color:"#8a7868", fontSize:"0.76rem" }}>Niemand live in der Nähe</div>
              : liveUsers.map(u => (
                <div key={u.user_id} onClick={() => mapInst.current?.setView([u.lat, u.lng], 16)}
                  style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid rgba(242,232,217,0.04)", transition:"background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(242,232,217,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <img src={av(u.profiles)} style={{ width:"32px", height:"32px", borderRadius:"50%", objectFit:"cover", border:"2px solid #4a9e72" }} alt=""/>
                  <div>
                    <div style={{ fontSize:"0.8rem", color:"#f2e8d9", fontWeight:"500" }}>{u.profiles?.name}</div>
                    <div style={{ fontSize:"0.67rem", color:"#4a9e72" }}>● Live</div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {showPanel === "myevents" && (
          <div style={{ maxHeight:"300px", overflowY:"auto" }}>
            {myEvents.length === 0
              ? <div style={{ padding:"16px", textAlign:"center", color:"#8a7868", fontSize:"0.76rem" }}>Noch keine Events erstellt</div>
              : myEvents.map(e => (
                <div key={e.id}
                  style={{ display:"flex", alignItems:"flex-start", gap:"8px", padding:"10px 14px", borderBottom:"1px solid rgba(242,232,217,0.04)", cursor:"pointer" }}
                  onClick={() => mapInst.current?.setView([e.lat, e.lng], 16)}>
                  <div style={{ fontSize:"1.2rem", flexShrink:0 }}>{e.emoji}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"0.8rem", color:"#f2e8d9", fontWeight:"500", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.title}</div>
                    <div style={{ fontSize:"0.68rem", color:"#8a7868", marginTop:"2px" }}>{e.category}</div>
                  </div>
                  <button onClick={async (ev) => { ev.stopPropagation(); await supabase.from("events").delete().eq("id", e.id); }}
                    style={{ background:"transparent", border:"none", color:"#8a7868", cursor:"pointer", fontSize:"0.9rem", padding:"2px", flexShrink:0 }}>🗑</button>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* ── SELECTED EVENT DETAIL ── */}
      {selectedEvent && (
        <div style={{ position:"absolute", bottom:"calc(env(safe-area-inset-bottom, 0px) + 8px)", left:12, zIndex:1000, width:"min(300px, calc(100vw - 24px))", background:"rgba(20,18,16,0.96)", backdropFilter:"blur(16px)", border:"1px solid rgba(242,232,217,0.12)", borderRadius:"20px", overflow:"hidden", boxShadow:"0 12px 40px rgba(0,0,0,0.7)", animation:"slideUp 0.3s ease" }}>
          <div style={{ padding:"16px 18px 14px", borderBottom:"1px solid rgba(242,232,217,0.07)", display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ fontSize:"1.6rem" }}>{selectedEvent.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"0.95rem", color:"#f2e8d9", fontWeight:"600" }}>{selectedEvent.title}</div>
              <div style={{ fontSize:"0.72rem", color:"#8a7868", marginTop:"2px" }}>{selectedEvent.category} · von {selectedEvent.profiles?.name||"?"}</div>
            </div>
            <button onClick={() => setSelectedEvent(null)} style={{ background:"transparent", border:"none", color:"#8a7868", cursor:"pointer", fontSize:"1.1rem" }}>✕</button>
          </div>
          <div style={{ padding:"12px 18px" }}>
            {selectedEvent.description && <div style={{ fontSize:"0.82rem", color:"#c4b09a", marginBottom:"10px", lineHeight:"1.5" }}>{selectedEvent.description}</div>}
            {selectedEvent.event_date && <div style={{ fontSize:"0.76rem", color:"#d97a5c", marginBottom:"10px" }}>📅 {new Date(selectedEvent.event_date).toLocaleString("de-DE",{dateStyle:"full",timeStyle:"short"})}</div>}
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={() => { mapInst.current?.setView([selectedEvent.lat, selectedEvent.lng], 17); setSelectedEvent(null); }}
                style={{ flex:1, padding:"9px", borderRadius:"10px", background:"rgba(191,92,64,0.15)", border:"1px solid rgba(191,92,64,0.3)", color:"#d97a5c", fontFamily:"system-ui", fontSize:"0.8rem", cursor:"pointer" }}>
                🗺️ Hinzoomen
              </button>
              {selectedEvent.created_by === session?.user?.id && (
                <button onClick={() => deleteEvent(selectedEvent.id)}
                  style={{ flex:1, padding:"9px", borderRadius:"10px", background:"rgba(191,64,64,0.15)", border:"1px solid rgba(191,64,64,0.3)", color:"#f08080", fontFamily:"system-ui", fontSize:"0.8rem", cursor:"pointer" }}>
                  🗑️ Löschen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ALFRED PANEL ── */}
      {alfredPanel && alfredSuggestions.length > 0 && (
        <div style={{ position:"absolute", bottom:"calc(env(safe-area-inset-bottom, 0px) + 8px)", right:12, zIndex:1000, width:"min(260px, calc(100vw - 24px))", background:"rgba(20,18,16,0.96)", backdropFilter:"blur(16px)", border:"1px solid rgba(191,92,64,0.3)", borderRadius:"20px", overflow:"hidden", boxShadow:"0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(191,92,64,0.1)", animation:"slideUp 0.4s ease" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(242,232,217,0.07)", display:"flex", alignItems:"center", gap:"10px" }}>
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=alfred&backgroundColor=bf5c40" style={{ width:"30px", height:"30px", borderRadius:"50%", border:"2px solid #bf5c40" }} alt="Alfred"/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"0.82rem", color:"#d97a5c", fontWeight:"600" }}>Alfred 🎩</div>
              <div style={{ fontSize:"0.66rem", color:"#8a7868" }}>Dein Karten-Butler</div>
            </div>
            <button onClick={() => setAlfredPanel(false)} style={{ background:"transparent", border:"none", color:"#8a7868", cursor:"pointer", fontSize:"1rem" }}>✕</button>
          </div>
          <div style={{ padding:"10px 0" }}>
            {alfredSuggestions.map((s, i) => (
              <div key={i} onClick={s.action || undefined}
                style={{ display:"flex", alignItems:"flex-start", gap:"10px", padding:"10px 16px", cursor:s.action?"pointer":"default", borderBottom:i<alfredSuggestions.length-1?"1px solid rgba(242,232,217,0.04)":"none", transition:"background 0.15s" }}
                onMouseEnter={e => s.action && (e.currentTarget.style.background="rgba(191,92,64,0.08)")}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <div style={{ fontSize:"1.1rem", flexShrink:0, marginTop:"1px" }}>{s.icon}</div>
                <div style={{ fontSize:"0.78rem", color:"#c4b09a", lineHeight:"1.5" }}>{s.text}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:"10px 16px", borderTop:"1px solid rgba(242,232,217,0.06)", display:"flex", gap:"6px" }}>
            <button onClick={() => { setAlfredPanel(false); setShowCreate(true); setClickLatLng(mapInst.current?.getCenter()); setClickAddress("Aktueller Kartenausschnitt"); }}
              style={{ flex:1, padding:"8px", borderRadius:"10px", background:"rgba(191,92,64,0.15)", border:"1px solid rgba(191,92,64,0.25)", color:"#d97a5c", fontFamily:"system-ui", fontSize:"0.75rem", cursor:"pointer" }}>
              📍 Event erstellen
            </button>
            <button onClick={toggleLive}
              style={{ flex:1, padding:"8px", borderRadius:"10px", background:isLive?"rgba(191,92,64,0.25)":"rgba(74,158,114,0.12)", border:`1px solid ${isLive?"rgba(191,92,64,0.4)":"rgba(74,158,114,0.25)"}`, color:isLive?"#d97a5c":"#4a9e72", fontFamily:"system-ui", fontSize:"0.75rem", cursor:"pointer" }}>
              {isLive ? "🔴 Live aus" : "🟢 Live an"}
            </button>
          </div>
        </div>
      )}

      {!alfredPanel && (
        <button onClick={() => setAlfredPanel(true)} style={{ position:"absolute", bottom:24, right:24, zIndex:1000, width:"44px", height:"44px", borderRadius:"50%", background:"rgba(20,18,16,0.92)", border:"1px solid rgba(191,92,64,0.4)", cursor:"pointer", fontSize:"1.1rem", boxShadow:"0 4px 16px rgba(0,0,0,0.5)", backdropFilter:"blur(12px)" }}>
          🎩
        </button>
      )}

      {/* ── PROXIMITY ALERT ── */}
      {nearbyAlert && (
        <div style={{ position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:1000, background:"rgba(20,18,16,0.96)", backdropFilter:"blur(16px)", border:"1px solid rgba(191,92,64,0.5)", borderRadius:"20px", padding:"14px 22px", display:"flex", alignItems:"center", gap:"12px", boxShadow:"0 12px 40px rgba(0,0,0,0.6),0 0 40px rgba(191,92,64,0.12)", animation:"toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)", maxWidth:"320px" }}>
          <div style={{ fontSize:"1.8rem" }}>💘</div>
          <div>
            <div style={{ fontSize:"0.65rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"#d97a5c", fontWeight:"600" }}>GetCrush Nearby!</div>
            <div style={{ fontSize:"0.92rem", color:"#f2e8d9", fontWeight:"600", marginTop:"2px" }}>{nearbyAlert.name} ist {Math.round(nearbyAlert.distance_m)}m entfernt</div>
            <div style={{ fontSize:"0.72rem", color:"#8a7868" }}>Auf der Karte sichtbar</div>
          </div>
          <button onClick={() => setNearbyAlert(null)} style={{ marginLeft:"auto", background:"transparent", border:"none", color:"#8a7868", cursor:"pointer", fontSize:"1.1rem" }}>✕</button>
        </div>
      )}

      {/* ── CREATE EVENT MODAL ── */}
      {showCreate && (
        <div style={{ position:"absolute", inset:0, zIndex:2000, background:"rgba(5,4,3,0.85)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={() => setShowCreate(false)}>
          <div style={{ background:"#1a1612", border:"1px solid rgba(242,232,217,0.1)", borderRadius:"24px", width:"100%", maxWidth:"440px", padding:"26px", boxShadow:"0 24px 60px rgba(0,0,0,0.7)", animation:"popUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"18px" }}>
              <div>
                <div style={{ fontFamily:"Georgia,serif", fontSize:"1.5rem", fontWeight:"600", color:"#f2e8d9" }}>📍 Event erstellen</div>
                {clickAddress && <div style={{ fontSize:"0.74rem", color:"#8a7868", marginTop:"4px", maxWidth:"300px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📌 {clickAddress}</div>}
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background:"transparent", border:"none", color:"#8a7868", fontSize:"1.3rem", cursor:"pointer" }}>✕</button>
            </div>

            {/* Address Search inside modal */}
            <div style={{ marginBottom:"14px", position:"relative" }}>
              <div style={{ fontSize:"0.66rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7868", marginBottom:"7px", fontWeight:"500" }}>Standort ändern</div>
              <div style={{ position:"relative" }}>
                <input
                  value={modalSearch}
                  onChange={e => { setModalSearch(e.target.value); searchInModal(e.target.value); }}
                  placeholder="🔍 Andere Adresse suchen..."
                  style={{ width:"100%", padding:"10px 14px", background:"#231e19", border:"1px solid rgba(242,232,217,0.12)", borderRadius:"10px", color:"#f2e8d9", fontFamily:"system-ui", fontSize:"0.84rem", outline:"none", transition:"border-color 0.2s" }}
                  onFocus={e => e.target.style.borderColor="rgba(191,92,64,0.5)"}
                  onBlur={e => e.target.style.borderColor="rgba(242,232,217,0.12)"}
                />
                {modalSearching && <div style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"0.75rem", color:"#8a7868" }}>...</div>}
              </div>
              {modalResults.length > 0 && (
                <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#1a1612", border:"1px solid rgba(242,232,217,0.12)", borderRadius:"12px", overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.6)", zIndex:100 }}>
                  {modalResults.map((r, i) => (
                    <div key={i} onClick={() => selectModalAddress(r)}
                      style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid rgba(242,232,217,0.04)", fontSize:"0.78rem", color:"#c4b09a", transition:"background 0.15s", display:"flex", alignItems:"center", gap:"8px" }}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(191,92,64,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <span style={{ flexShrink:0 }}>📍</span>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.display_name.split(",").slice(0,3).join(", ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emoji */}
            <div style={{ marginBottom:"14px" }}>
              <div style={{ fontSize:"0.66rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7868", marginBottom:"8px", fontWeight:"500" }}>Emoji</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                {EVENT_EMOJIS.map(e => (
                  <button key={e} onClick={() => setEvEmoji(e)} style={{ width:"34px", height:"34px", borderRadius:"8px", border:`1px solid ${evEmoji===e?"rgba(191,92,64,0.6)":"rgba(242,232,217,0.1)"}`, background:evEmoji===e?"rgba(191,92,64,0.15)":"transparent", fontSize:"1rem", cursor:"pointer", transition:"all 0.15s" }}>{e}</button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom:"12px" }}>
              <div style={{ fontSize:"0.66rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7868", marginBottom:"7px", fontWeight:"500" }}>Titel *</div>
              <input autoFocus value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="z.B. Kaffee am Gendarmenmarkt?" onKeyDown={e => e.key==="Enter" && createEvent()}
                style={{ width:"100%", padding:"11px 14px", background:"#231e19", border:"1px solid rgba(242,232,217,0.1)", borderRadius:"10px", color:"#f2e8d9", fontFamily:"system-ui", fontSize:"0.88rem", outline:"none" }}/>
            </div>

            {/* Desc */}
            <div style={{ marginBottom:"12px" }}>
              <div style={{ fontSize:"0.66rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7868", marginBottom:"7px", fontWeight:"500" }}>Beschreibung</div>
              <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Was ist geplant?"
                style={{ width:"100%", padding:"11px 14px", background:"#231e19", border:"1px solid rgba(242,232,217,0.1)", borderRadius:"10px", color:"#f2e8d9", fontFamily:"system-ui", fontSize:"0.84rem", outline:"none", resize:"vertical", minHeight:"64px" }}/>
            </div>

            {/* Date + Category */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"18px" }}>
              <div>
                <div style={{ fontSize:"0.66rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7868", marginBottom:"7px", fontWeight:"500" }}>Datum & Uhrzeit</div>
                <input type="datetime-local" value={evDate} onChange={e => setEvDate(e.target.value)}
                  style={{ width:"100%", padding:"9px 12px", background:"#231e19", border:"1px solid rgba(242,232,217,0.1)", borderRadius:"10px", color:"#f2e8d9", fontFamily:"system-ui", fontSize:"0.78rem", outline:"none" }}/>
              </div>
              <div>
                <div style={{ fontSize:"0.66rem", textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7868", marginBottom:"7px", fontWeight:"500" }}>Kategorie</div>
                <select value={evCat} onChange={e => setEvCat(e.target.value)}
                  style={{ width:"100%", padding:"9px 12px", background:"#231e19", border:"1px solid rgba(242,232,217,0.1)", borderRadius:"10px", color:"#f2e8d9", fontFamily:"system-ui", fontSize:"0.78rem", outline:"none", cursor:"pointer" }}>
                  {["Treffen","Party","Sport","Essen","Sonstiges"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setShowCreate(false)} style={{ flex:1, padding:"12px", borderRadius:"12px", background:"rgba(242,232,217,0.07)", border:"1px solid rgba(242,232,217,0.1)", color:"#c4b09a", fontFamily:"system-ui", fontSize:"0.86rem", cursor:"pointer" }}>Abbrechen</button>
              <button onClick={createEvent} disabled={!evTitle.trim()||creating}
                style={{ flex:2, padding:"12px", borderRadius:"12px", background:evTitle.trim()?"#bf5c40":"rgba(191,92,64,0.25)", border:"none", color:"#fff", fontFamily:"system-ui", fontSize:"0.86rem", fontWeight:"500", cursor:evTitle.trim()?"pointer":"not-allowed", transition:"all 0.2s" }}>
                {creating ? "Erstelle..." : `${evEmoji} Event pinnen`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
