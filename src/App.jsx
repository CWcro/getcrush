import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import Legal from "./Legal.jsx";

// Push Notifications (only in Capacitor/native app)
const sendPush = async (to_user_id, type, from_name, message = "") => {
  try {
    await supabase.functions.invoke("send-push", {
      body: { type, to_user_id, from_name, message }
    });
  } catch (e) { console.log("Push error:", e); }
};

const setupPushNotifications = async () => {
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.requestPermissions();
    await PushNotifications.register();
    PushNotifications.addListener("registration", async (token) => {
      console.log("Push token:", token.value);
      // Save token to Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from("profiles").update({ push_token: token.value }).eq("id", session.user.id);
      }
    });
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Push received:", notification);
    });
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("Push action:", action);
    });
  } catch (e) {
    console.log("Push not available (web):", e.message);
  }
};
import MapView from "./MapView.jsx";
import PhotoUpload from "./PhotoUpload.jsx";
import MobileLanding from "./MobileLanding.jsx";
import "./index.css";

const INTERESTS = ["Reisen","Sport","Musik","Kochen","Kunst","Gaming","Natur","Film","Yoga","Lesen","Tanz","Fotografie","Klettern","Wein","Mode"];



const av = (p) => (p?.photos && p.photos[0]) || p?.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${p?.id}`;

// ── ALFRED BOT ──

const SLASH_COMMANDS = [
  { cmd: "/hilfe",       desc: "Alle Befehle anzeigen" },
  { cmd: "/räume",       desc: "Alle Chaträume auflisten" },
  { cmd: "/erstellen",   desc: "Neuen Raum erstellen — z.B. /erstellen Potsdam" },
  { cmd: "/wechseln",    desc: "Raum wechseln  z.B. /wechseln Berlin" },
  { cmd: "/tipp",        desc: "Dating-Tipp von Alfred" },
  { cmd: "/flirt",       desc: "Flirt-Ratschlag von Alfred" },
  { cmd: "/witz",        desc: "Alfred erzählt einen Witz" },
];

const ALFRED_TIPS = [
  "Tipp von Alfred: Schreiben Sie als Erstes — wer wartet, verliert. 🎩",
  "Tipp von Alfred: Ein echtes Kompliment schlägt jede Pickup-Line. 🎩",
  "Tipp von Alfred: Fragen Sie nach dem Lieblingsort — nicht nach dem Job. 🎩",
  "Tipp von Alfred: Humor öffnet mehr Türen als Muskeln. 🎩",
  "Tipp von Alfred: Authentizität ist das neue Premium-Feature. Kostenlos, wie GetCrush. 🎩",
];

const ALFRED_FLIRTS = [
  "Flirt-Tipp: 'Was machst du, wenn du nicht hier bist?' — simpel, effektiv, Alfred-geprüft. 🎩",
  "Flirt-Tipp: Lachen ist ansteckend. Bringen Sie jemanden zum Lachen — halb gewonnen. 🎩",
  "Flirt-Tipp: Zeigen Sie echtes Interesse. Fragen Sie nach dem, was sie/er im Profil erwähnt hat. 🎩",
  "Flirt-Tipp: Kurz und prägnant schreiben. Romane schreibt man nach dem ersten Date. 🎩",
];

const ALFRED_JOKES = [
  "Warum hat der Programmierer kein Date? Weil er immer auf die Antwort wartet... und sie kommt nie. 🎩",
  "Was sagt ein Butler auf einer Dating-App? 'Darf ich Ihre Nummer haben — für rein professionelle Zwecke?' 🎩",
  "Tinder und ich haben eines gemeinsam: Wir wurden beide mal für zu teuer gehalten. GetCrush ist gratis. 🎩",
  "Wie nennt man einen Single-Butler? Unaufgefordert zu Diensten. 🎩",
];


const ALFRED_AVATAR = "https://api.dicebear.com/7.x/bottts/svg?seed=alfred&backgroundColor=bf5c40";

const ALFRED_GREETINGS = [
  "Willkommen, mein Freund! Alfred ist stets zu Diensten. 🎩",
  "Ah, ein neues Gesicht! Ich bin Alfred — Batmans Butler, jetzt auch bei GetCrush. 🎩",
  "Treten Sie ein! Alfred hat bereits den roten Teppich ausgerollt. 🎩",
  "Guten Tag! Ein Butler ohne Arbeit ist wie eine Dating-App ohne Matches — undenkbar. 🎩",
  "Herzlich willkommen! Alfred freut sich über jeden neuen Gast. 🎩",
];

const ALFRED_POOL = {
  gruss: ["Guten Tag! Alfred verneigt sich charmant. 🎩", "Wie erfreulich! Stets zu Diensten. 🎩", "Ah, wie schön! 🎩"],
  flirt: ["Flirten ist eine Kunst — beginnen Sie mit einem ehrlichen Kompliment! 🎩", "Alfred empfiehlt: direkt, charmant, authentisch. Kein Premium-Abo nötig. 🎩"],
  liebe: ["Liebe kommt unerwartet — wie ein guter Butler. 🎩", "Echte Verbindungen entstehen durch echte Gespräche. Alfred weiß das. 🎩"],
  hilfe: ["Alfred hilft gerne! Was darf es sein? 🎩", "Natürlich! Dafür bin ich da. 🎩"],
  witzig: ["Ha! Alfred schätzt Humor sehr. 🎩", "Ausgezeichnet! Humor ist Alfreds zweitliebste Eigenschaft — nach Diskretion. 🎩"],
  langweilig: ["Langweilig? Stellen Sie sich vor — das belebt jeden Raum! 🎩", "Alfred schlägt vor: eine Frage an alle stellen. Wirkt Wunder. 🎩"],
  default: [
    "Interessant. Alfred merkt sich das. 🎩",
    "Vortrefflich gesagt! 🎩",
    "GetCrush — kostenlos, ehrlich, mit erstklassigem Butler-Service. 🎩",
    "Alfred empfiehlt: einfach authentisch sein. Das zieht mehr an als jedes Abo. 🎩",
    "Wie erfrischend direkt! Alfred schätzt das sehr. 🎩",
    "Ein weiser Gedanke. Alfred nickt anerkennend. 🎩",
  ]
};

const alfredReply = (msg, isGreeting = false) => {
  if (isGreeting) {
    return ALFRED_GREETINGS[Math.floor(Math.random() * ALFRED_GREETINGS.length)];
  }
  const l = (msg || "").toLowerCase();
  let pool = ALFRED_POOL.default;
  if (/hallo|hi |hey|moin|servus|guten/.test(l)) pool = ALFRED_POOL.gruss;
  else if (/flirt|anschreib|ansprechen/.test(l)) pool = ALFRED_POOL.flirt;
  else if (/liebe|verliebt|beziehung|partner/.test(l)) pool = ALFRED_POOL.liebe;
  else if (/hilfe|help|wie |was |kannst/.test(l)) pool = ALFRED_POOL.hilfe;
  else if (/haha|lol|witzig|lustig|😂/.test(l)) pool = ALFRED_POOL.witzig;
  else if (/langweilig|nichts los|still/.test(l)) pool = ALFRED_POOL.langweilig;
  return pool[Math.floor(Math.random() * pool.length)];
};

export default function App() {
  // Mobile detection — show store page on mobile browser
  // BUT not when running inside Capacitor (native app)
  const isCapacitor = window.Capacitor !== undefined || window.location.protocol === "capacitor:";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const forceWeb = new URLSearchParams(window.location.search).get("web") === "1";
  if (isMobile && !forceWeb && !isCapacitor) return <MobileLanding />;

  const [session, setSession] = useState(null);
  const [view, setView] = useState("landing");
  const [tab, setTab] = useState(() => localStorage.getItem("gc_tab") || "discover");

  // Persist tab on change
  const switchTab = (t) => { setTab(t); localStorage.setItem("gc_tab", t); };
  const [authMode, setAuthMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [me, setMe] = useState(null);
  const [setupName, setSetupName] = useState("");
  const [setupAge, setSetupAge] = useState("");
  const [setupCity, setSetupCity] = useState("");
  const [setupBio, setSetupBio] = useState("");
  const [setupInterests, setSetupInterests] = useState([]);
  const [setupGender, setSetupGender] = useState("");
  const [setupPhotos, setSetupPhotos] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [profiles, setProfiles] = useState([]);
  const [liked, setLiked] = useState({});
  const [matchToast, setMatchToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [ageMax, setAgeMax] = useState(35);
  const [filterInterests, setFilterInterests] = useState([]);

  const [matches, setMatches] = useState([]);
  const [chatWith, setChatWith] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const msgEnd = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState([]);
  const [roomMsgText, setRoomMsgText] = useState("");
  const [alfredTyping, setAlfredTyping] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [legalPage, setLegalPage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(() => !localStorage.getItem("gc_cookies_accepted"));
  // Debug activeRoom changes
  useEffect(() => { console.log("activeRoom changed:", activeRoom?.name || "null"); }, [activeRoom]);
  const [userPopup, setUserPopup] = useState(null); // profile to show
  const [crushRequests, setCrushRequests] = useState([]); // incoming
  const [crushSent, setCrushSent] = useState([]); // outgoing
  const [showCmds, setShowCmds] = useState(false);
  const [cmdFilter, setCmdFilter] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showSwitchRoom, setShowSwitchRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCategory, setNewRoomCategory] = useState("Sonstiges");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [roomUserCount, setRoomUserCount] = useState(0);
  const presenceChannel = useRef(null);
  const roomMsgEnd = useRef(null);
  const roomChannel = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAfterLogin(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadAfterLogin(s);
      else { setView("landing"); setMe(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadAfterLogin = async (s) => {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", s.user.id).single();
    if (p?.name) {
      setMe(p);
      setView("app");
      const savedTab = localStorage.getItem("gc_tab") || "discover";
      setTab(savedTab);
      // Setup push in native app
      if (window.Capacitor !== undefined) setupPushNotifications();
      loadProfiles(s.user.id);
      loadLikes(s.user.id);
      loadMatches(s.user.id);
      loadRooms();
      loadCrushRequests(s.user.id);
      // Restore Alfred match if previously matched
      if (localStorage.getItem("gc_alfred_matched")) {
        setMatches(prev => prev.find(m => m.id === "alfred") ? prev : [{
          id:"alfred", name:"Alfred 🎩", avatar_url:ALFRED_AVATAR,
          age:null, city:"Überall", bio:"Ihr persönlicher GetCrush-Butler.",
          interests:["Etikette","Tee","Matchmaking"], isAlfred:true, online:true
        }, ...prev]);
      }
    } else {
      setView("setup");
    }
  };

  const crushChannelRef = useRef(null);
  const loadCrushRequests = async (myId) => {
    const { data: inc } = await supabase.from("crush_requests")
      .select("*, profiles!crush_requests_from_user_fkey(name,avatar_url,age,city,id)")
      .eq("to_user", myId).eq("status","pending");
    setCrushRequests(inc || []);
    const { data: out } = await supabase.from("crush_requests")
      .select("to_user,status").eq("from_user", myId);
    setCrushSent(out || []);
    if (crushChannelRef.current) return;
    crushChannelRef.current = supabase.channel("crush-rt-" + Date.now());
    crushChannelRef.current
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crush_requests", filter: `to_user=eq.${myId}` }, async (p) => {
        const { data: prof } = await supabase.from("profiles").select("name,avatar_url,age,city,id").eq("id", p.new.from_user).single();
        setCrushRequests(prev => [...prev, { ...p.new, profiles: prof }]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "crush_requests", filter: `from_user=eq.${myId}` }, (p) => {
        if (p.new.status === "accepted") {
          loadMatches(myId);
          setCrushSent(prev => prev.map(c => c.to_user === p.new.to_user ? { ...c, status: "accepted" } : c));
        }
      })
      .subscribe();
  };

  const ALFRED_MATCH = {
    id: "alfred",
    name: "Alfred 🎩",
    avatar_url: ALFRED_AVATAR,
    age: null,
    city: "Überall",
    bio: "Ihr persönlicher GetCrush-Butler. Stets zu Diensten.",
    interests: ["Etikette","Tee","Matchmaking"],
    isAlfred: true,
    online: true,
  };

  const sendCrush = async (toUser) => {
    // Special case: Alfred auto-accepts 🎩
    if (toUser.isAlfred) {
      setUserPopup(null);
      localStorage.setItem("gc_alfred_matched", "1");
      // Add alfred to matches
      setMatches(prev => prev.find(m => m.id === "alfred") ? prev : [ALFRED_MATCH, ...prev]);
      setTimeout(() => {
        setMatchToast({ name: "Alfred 🎩", avatar_url: ALFRED_AVATAR });
        setTimeout(() => setMatchToast(null), 4000);
      }, 600);
      return;
    }
    const already = crushSent.find(c => c.to_user === toUser.id);
    if (already) return;
    const { error } = await supabase.from("crush_requests").insert({ from_user: session.user.id, to_user: toUser.id });
    if (!error) {
      setCrushSent(prev => [...prev, { to_user: toUser.id, status: "pending" }]);
      setUserPopup(null);
    }
  };

  const respondCrush = async (req, accept) => {
    await supabase.from("crush_requests").update({ status: accept ? "accepted" : "declined" }).eq("id", req.id);
    if (accept) {
      // Also create mutual like so they appear as match
      await supabase.from("likes").upsert({ from_user: req.from_user, to_user: session.user.id });
      await supabase.from("likes").upsert({ from_user: session.user.id, to_user: req.from_user });
      loadMatches(session.user.id);
    }
    setCrushRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const loadProfiles = async (myId) => {
    const { data } = await supabase.from("profiles").select("*").neq("id", myId).not("name","is",null);
    setProfiles(data || []);
  };

  const loadLikes = async (myId) => {
    const { data } = await supabase.from("likes").select("to_user").eq("from_user", myId);
    if (data) { const m = {}; data.forEach(l => m[l.to_user] = true); setLiked(m); }
  };

  const loadMatches = async (myId) => {
    const { data: iLikedData } = await supabase.from("likes").select("to_user").eq("from_user", myId);
    if (!iLikedData?.length) return;
    const iLiked = iLikedData.map(l => l.to_user);
    const { data: theyLike } = await supabase.from("likes").select("from_user").eq("to_user", myId).in("from_user", iLiked);
    if (!theyLike?.length) return;
    const ids = theyLike.map(l => l.from_user);
    const { data: mp } = await supabase.from("profiles").select("*").in("id", ids);
    setMatches(mp || []);
  };

  const roomsChannelRef = useRef(null);
  const cleanupEmptyRooms = async (currentActiveRoomId) => {
    // Use 10 min + extra buffer to avoid deleting rooms that were just created
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data } = await supabase.from("rooms")
      .select("id, created_at")
      .eq("is_official", false)
      .lt("created_at", tenMinAgo);
    if (!data?.length) return;
    for (const r of data) {
      // Never delete the currently open room
      if (r.id === currentActiveRoomId) continue;
      const { count } = await supabase.from("room_messages")
        .select("id", { count: "exact", head: true }).eq("room_id", r.id);
      if (count === 0) await supabase.from("rooms").delete().eq("id", r.id);
    }
  };

  const loadRooms = async () => {
    // Clean up old empty rooms first
    await cleanupEmptyRooms(activeRoom?.id);
    // Then load fresh list
    const { data } = await supabase.from("rooms").select("*").order("is_official", { ascending: false }).order("name");
    setRooms(data || []);
    if (roomsChannelRef.current) return;
    roomsChannelRef.current = supabase.channel("rooms-ch-" + Date.now());
    roomsChannelRef.current
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rooms" }, (p) => {
        setRooms(prev => {
          if (prev.find(r => r.id === p.new.id)) return prev;
          return [...prev, p.new].sort((a,b) => a.name.localeCompare(b.name));
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms" }, (p) => {
        setRooms(prev => prev.filter(r => r.id !== p.old.id));
        // Don't clear activeRoom if it's the one being shown
        setActiveRoom(prev => prev?.id === p.old.id ? null : prev);
      })
      .subscribe();
  };

  // Word filter
  const checkWordFilter = async (text) => {
    try {
      const { data } = await supabase.from("blocked_words").select("word");
      if (!data) return false;
      const lower = text.toLowerCase();
      return data.some(({ word }) => lower.includes(word));
    } catch (e) { return false; }
  };

  // ── PRIVATE CHAT ──
  const openChat = async (profile) => {
    setChatWith(profile);
    switchTab("chat");
    setMobileShowChat(true);

    // Alfred — load from localStorage
    if (profile.isAlfred) {
      const saved = localStorage.getItem("gc_alfred_msgs");
      const msgs = saved ? JSON.parse(saved) : [{
        id: "alf-welcome", from_user: "alfred", to_user: session.user.id,
        content: "Guten Tag! Alfred ist zu Ihrer Verfügung. Wie kann ich Ihnen behilflich sein? 🎩",
        created_at: new Date().toISOString(),
        profiles: { name: "Alfred 🎩", avatar_url: ALFRED_AVATAR }
      }];
      setMessages(msgs);
      setTimeout(() => msgEnd.current?.scrollIntoView({ behavior: "smooth" }), 100);
      return;
    }

    // Normal chat — load from Supabase
    const myId = session.user.id;
    const { data } = await supabase.from("messages").select("*")
      .or(`and(from_user.eq.${myId},to_user.eq.${profile.id}),and(from_user.eq.${profile.id},to_user.eq.${myId})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setTimeout(() => msgEnd.current?.scrollIntoView({ behavior: "smooth" }), 100);
    supabase.channel("priv-" + profile.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        const m = p.new;
        if ((m.from_user === myId && m.to_user === profile.id) || (m.from_user === profile.id && m.to_user === myId)) {
          setMessages(prev => {
            if (prev.find(x => x.id === m.id)) return prev;
            return [...prev, m];
          });
          setTimeout(() => msgEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      }).subscribe();
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !chatWith) return;
    const t = msgText;
    setMsgText("");
    const myMsg = { id: "opt-" + Date.now(), from_user: session.user.id, to_user: chatWith.id, content: t, created_at: new Date().toISOString(), profiles: { name: me?.name, avatar_url: me?.avatar_url } };
    setMessages(prev => {
      const updated = [...prev, myMsg];
      if (chatWith.isAlfred) localStorage.setItem("gc_alfred_msgs", JSON.stringify(updated));
      return updated;
    });
    setTimeout(() => msgEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);

    // Alfred antwortet im privaten Chat
    if (chatWith.isAlfred) {
      setTimeout(() => {
        const reply = alfredReply(t);
        const alfMsg = { id: "alf-" + Date.now(), from_user: "alfred", to_user: session.user.id, content: reply, created_at: new Date().toISOString(), profiles: { name: "Alfred 🎩", avatar_url: ALFRED_AVATAR } };
        setMessages(prev => {
          const updated = [...prev, alfMsg];
          localStorage.setItem("gc_alfred_msgs", JSON.stringify(updated));
          return updated;
        });
        setTimeout(() => msgEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }, 900 + Math.random() * 700);
      return;
    }
    await supabase.from("messages").insert({ from_user: session.user.id, to_user: chatWith.id, content: t });
    sendPush(chatWith.id, "message", me?.name || "Jemand", t.substring(0, 100));
  };

  // ── ROOM CHAT ──
  const openRoom = async (room) => {
    console.log("openRoom called:", room?.name, room?.id);
    setActiveRoom(room);
    switchTab("rooms");
    setMobileShowChat(true);
    setRoomMessages([]);
    console.log("activeRoom set, tab set to rooms");
    if (roomChannel.current) supabase.removeChannel(roomChannel.current);
    if (presenceChannel.current) {
      presenceChannel.current.untrack();
      supabase.removeChannel(presenceChannel.current);
    }

    const { data } = await supabase.from("room_messages")
      .select("*, profiles(name, avatar_url)")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true })
      .limit(100);
    setRoomMessages(data || []);
    setTimeout(() => roomMsgEnd.current?.scrollIntoView({ behavior: "smooth" }), 100);

    roomChannel.current = supabase.channel("room-" + room.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${room.id}` }, async (p) => {
        const m = p.new;
        const { data: prof } = await supabase.from("profiles").select("name,avatar_url").eq("id", m.from_user).single();
        setRoomMessages(prev => {
          if (prev.find(x => x.id === m.id)) return prev;
          return [...prev, { ...m, profiles: prof }];
        });
        setTimeout(() => roomMsgEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }).subscribe();

    // Presence — track users in room
    if (presenceChannel.current) supabase.removeChannel(presenceChannel.current);
    presenceChannel.current = supabase.channel("presence-room-" + room.id, { config: { presence: { key: session.user.id } } })
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.current.presenceState();
        const count = Object.keys(state).length;
        setRoomUserCount(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.current.track({ user_id: session.user.id, name: me?.name });
        }
      });

    // Alfred begrüßt und erklärt Befehle
    setTimeout(() => {
      setAlfredTyping(true);
      setTimeout(() => {
        const greeting = `Willkommen im Raum "${room.name}"! Ich bin Alfred, Ihr persönlicher Butler. 🎩

Folgende Befehle stehen zur Verfügung:
/hilfe       — Alle Befehle anzeigen
/räume       — Alle Räume auflisten
/wechseln    — Raum wechseln  (z.B. /wechseln Berlin)
/erstellen   — Eigenen Raum erstellen  (z.B. /erstellen Potsdam)
/tipp        — Dating-Tipp von Alfred
/flirt       — Flirt-Ratschlag
/witz        — Alfred erzählt einen Witz

Einfach / tippen um die Befehle zu sehen. Viel Vergnügen! 🎩`;
        setAlfredTyping(false);
        setRoomMessages(prev => [...prev, {
          id: "alfred-" + Date.now(),
          room_id: room.id,
          from_user: "alfred",
          content: greeting,
          created_at: new Date().toISOString(),
          profiles: { name: "Alfred 🎩", avatar_url: ALFRED_AVATAR }
        }]);
        setTimeout(() => roomMsgEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }, 1200);
    }, 800);
  };

  const addAlfredMsg = (text, roomId) => {
    setAlfredTyping(true);
    const rid = roomId || activeRoom?.id;
    setTimeout(() => {
      setAlfredTyping(false);
      setRoomMessages(prev => [...prev, {
        id: "alfred-" + Date.now(),
        room_id: rid,
        from_user: "alfred",
        content: text,
        created_at: new Date().toISOString(),
        profiles: { name: "Alfred 🎩", avatar_url: ALFRED_AVATAR }
      }]);
      setTimeout(() => roomMsgEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, 600 + Math.random() * 400);
  };

  const unmatch = async (profile) => {
    if (!window.confirm(`Match mit ${profile.name} wirklich löschen?`)) return;
    // Delete likes in both directions
    await supabase.from("likes").delete().eq("from_user", session.user.id).eq("to_user", profile.id);
    await supabase.from("likes").delete().eq("from_user", profile.id).eq("to_user", session.user.id);
    // Delete messages
    await supabase.from("messages")
      .delete()
      .or(`and(from_user.eq.${session.user.id},to_user.eq.${profile.id}),and(from_user.eq.${profile.id},to_user.eq.${session.user.id})`);
    // Update local state
    setMatches(prev => prev.filter(m => m.id !== profile.id));
    setChatWith(null);
    setMobileShowChat(false);
    setMessages([]);
    setTab("matches");
  };

  const deleteRoom = async (room) => {
    if (!window.confirm(`Raum "${room.name}" wirklich löschen?`)) return;
    const { error } = await supabase.from("rooms").delete().eq("id", room.id);
    if (!error) {
      setRooms(prev => prev.filter(r => r.id !== room.id));
      if (activeRoom?.id === room.id) {
        setActiveRoom(null);
        if (presenceChannel.current) { presenceChannel.current.untrack(); supabase.removeChannel(presenceChannel.current); }
      }
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) { setCreateError("Bitte einen Namen eingeben."); return; }
    if (newRoomName.length < 2 || newRoomName.length > 30) { setCreateError("Name muss 2–30 Zeichen lang sein."); return; }
    const exists = rooms.find(r => r.name.toLowerCase() === newRoomName.toLowerCase());
    if (exists) {
      // Room exists — just open it
      setShowCreateRoom(false);
      setNewRoomName(""); setNewRoomCategory("Sonstiges"); setCreateError("");
      openRoom(exists);
      return;
    }
    setCreateLoading(true);
    const emojis = {"Flirten":"💘","Städte":"🏙️","Interessen":"🎯","Sonstiges":"🌟"};
    const emoji = emojis[newRoomCategory] || "🌟";
    console.log("Creating room, session:", session?.user?.id, "name:", newRoomName);
    const { data: newRoom, error } = await supabase.from("rooms")
      .insert({ name: newRoomName, emoji, description: `Von ${me?.name} erstellt`, category: newRoomCategory, created_by: session.user.id, is_official: false })
      .select("*").single();
    setCreateLoading(false);
    console.log("Room result:", newRoom, "Error:", error?.message);
    if (newRoom) {
      // Update rooms list immediately
      setRooms(prev => {
        if (prev.find(r => r.id === newRoom.id)) return prev;
        return [...prev, newRoom].sort((a,b) => {
          if (a.is_official && !b.is_official) return -1;
          if (!a.is_official && b.is_official) return 1;
          return a.name.localeCompare(b.name);
        });
      });
      // Close modal and reset
      setShowCreateRoom(false);
      setNewRoomName(""); setNewRoomCategory("Sonstiges"); setCreateError("");
      // Set active room and tab DIRECTLY without openRoom to avoid async issues
      setActiveRoom(newRoom);
      setRoomMessages([]);
      setMobileShowChat(true);
      switchTab("rooms");
      // Load messages async
      supabase.from("room_messages")
        .select("*, profiles(name, avatar_url)")
        .eq("room_id", newRoom.id)
        .order("created_at", { ascending: true })
        .limit(100)
        .then(({ data }) => {
          setRoomMessages(data || []);
          // Alfred greeting
          setTimeout(() => {
            setAlfredTyping(true);
            setTimeout(() => {
              setAlfredTyping(false);
              setRoomMessages(prev => [...prev, {
                id: "alfred-" + Date.now(), room_id: newRoom.id, from_user: "alfred",
                content: `Willkommen im Raum "${newRoom.name}"! Alfred ist stets zu Diensten. 🎩`,
                created_at: new Date().toISOString(),
                profiles: { name: "Alfred 🎩", avatar_url: ALFRED_AVATAR }
              }]);
            }, 1200);
          }, 800);
        });
    } else {
      const msg = error?.message || "Unbekannter Fehler";
      setCreateError("Fehler: " + msg);
    }
  };

  const handleSlashCommand = async (t) => {
    const parts = t.trim().split(" ");
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ").trim();

    if (cmd === "/hilfe") {
      const list = SLASH_COMMANDS.map(c => `${c.cmd} — ${c.desc}`).join("\n");
      addAlfredMsg("Verfügbare Befehle:\n" + list + "\n\nAlfred ist stets zu Diensten. 🎩");
      return true;
    }
    if (cmd === "/räume" || cmd === "/raume") {
      const list = rooms.map(r => `${r.emoji} ${r.name}`).join("  ·  ");
      addAlfredMsg("Aktive Räume: " + list + " 🎩");
      return true;
    }
    if (cmd === "/tipp") {
      addAlfredMsg(ALFRED_TIPS[Math.floor(Math.random() * ALFRED_TIPS.length)]);
      return true;
    }
    if (cmd === "/flirt") {
      addAlfredMsg(ALFRED_FLIRTS[Math.floor(Math.random() * ALFRED_FLIRTS.length)]);
      return true;
    }
    if (cmd === "/witz") {
      addAlfredMsg(ALFRED_JOKES[Math.floor(Math.random() * ALFRED_JOKES.length)]);
      return true;
    }
    if (cmd === "/wechseln") {
      if (!arg) {
        setShowSwitchRoom(true);
        return true;
      }
      const found = rooms.find(r => r.name.toLowerCase().includes(arg.toLowerCase()));
      if (found) { openRoom(found); return true; }
      addAlfredMsg(`Keinen Raum namens "${arg}" gefunden. Versuchen Sie /räume für die Liste. 🎩`);
      return true;
    }
    if (cmd === "/erstellen") {
      setShowCreateRoom(true);
      return true;
    }
    return false;
  };

  const sendRoomMessage = async () => {
    if (!roomMsgText.trim() || !activeRoom) return;
    const t = roomMsgText;
    setRoomMsgText("");
    setShowCmds(false);

    // Slash command?
    if (t.startsWith("/")) {
      const handled = await handleSlashCommand(t);
      if (handled) return;
    }

    // Optimistisch sofort anzeigen
    const optimistic = {
      id: "opt-" + Date.now(),
      room_id: activeRoom.id,
      from_user: session.user.id,
      content: t,
      created_at: new Date().toISOString(),
      profiles: { name: me?.name, avatar_url: me?.avatar_url }
    };
    setRoomMessages(prev => [...prev, optimistic]);
    setTimeout(() => roomMsgEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);

    // Word filter for messages
    const msgBlocked = await checkWordFilter(t);
    if (msgBlocked) {
      addAlfredMsg("Alfred bittet Sie, die Hausregeln zu beachten. Diese Nachricht wurde blockiert. 🎩");
      return;
    }
    await supabase.from("room_messages").insert({ room_id: activeRoom.id, from_user: session.user.id, content: t });

    // Alfred antwortet manchmal
    if (Math.random() > 0.2) {
      setTimeout(() => { addAlfredMsg(alfredReply(t)); }, 600);
    }
  };

  // ── AUTH ──
  const handleRegister = async () => {
    setLoading(true); setError(""); setSuccess("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setSuccess("Bestätigungsmail gesendet!");
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) { setError("Bitte E-Mail eingeben."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) setError(error.message);
    else setSuccess("Passwort-Reset E-Mail gesendet! Bitte Postfach checken.");
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) setError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setMe(null); setProfiles([]); setLiked({}); setMatches([]);
    setView("landing");
  };

  // ── SETUP ──
  const compressImage = (file, maxWidth = 800, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setUploadError("");
    // Show preview immediately
    setAvatarPreview(URL.createObjectURL(f));
    // Compress
    const compressed = await compressImage(f);
    setAvatarFile(compressed);
  };

  const handleSetupSave = async () => {
    if (!setupName || !setupAge || !setupCity) { setError("Name, Alter und Stadt sind Pflicht."); return; }
    if (parseInt(setupAge) < 18) { setError("Du musst mindestens 18 Jahre alt sein um GetCrush zu nutzen."); return; }
    if (parseInt(setupAge) > 99) { setError("Bitte gib ein gültiges Alter ein."); return; }
    setLoading(true); setError("");
    // Use first photo as avatar_url, all photos in photos array
    const avatarUrl = setupPhotos[0] || me?.avatar_url || null;
    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id, name: setupName, age: parseInt(setupAge),
      city: setupCity, bio: setupBio, interests: setupInterests,
      gender: setupGender, avatar_url: avatarUrl, photos: setupPhotos,
    });
    if (error) { setError(error.message); setLoading(false); return; }
    const { data: p } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    setMe(p);
    setView("app");
    const savedTab = localStorage.getItem("gc_tab") || "discover";
    setTab(savedTab);
    loadProfiles(session.user.id);
    loadMatches(session.user.id);
    loadRooms();
    setLoading(false);
    setUploading(false);
    setUploadProgress(0);
    setUploadError("");
    setAvatarFile(null);
  };

  // ── LIKE ──
  const handleLike = async (e, p) => {
    e.stopPropagation();
    if (liked[p.id]) return;
    setLiked(prev => ({ ...prev, [p.id]: true }));
    if (!p.id.startsWith("d") && session) {
      await supabase.from("likes").insert({ from_user: session.user.id, to_user: p.id });
      const { data } = await supabase.from("likes").select("id").eq("from_user", p.id).eq("to_user", session.user.id).single();
      if (data) { setMatches(prev => [...prev, p]); setTimeout(() => setMatchToast(p), 500); }
    }
  };

  const toggleI = (i, setter) => setter(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const filtered = profiles.filter(p => {
    if (ageMax && p.age > ageMax) return false;
    if (filterInterests.length === 0) return true;
    return filterInterests.some(i => (p.interests || []).includes(i));
  });

  // ══════════════════════════════════════
  // VIEWS
  // ══════════════════════════════════════

  if (view === "landing") return (
    <div>
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
      <nav className="nav">
        <div className="logo">Get<span>Crush</span></div>
        <div className="nav-right">
          <button className="btn-nav-ghost" onClick={() => { setAuthMode("login"); setView("auth"); }}>Anmelden</button>
          <button className="btn-nav-fill" onClick={() => { setAuthMode("register"); setView("auth"); }}>Kostenlos starten</button>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-eyebrow">100 % kostenlos — für immer</div>
        <h1 className="hero-h1">Find your<br/><em>Crush.</em><br/>No bullshit.</h1>
        <p className="hero-sub">Kein Abo. Kein Paywall. Keine beschissenen Fake-Accounts wie bei allen anderen. Nur echte Menschen — gratis.</p>
        <div className="hero-actions">
          <button className="btn-hero btn-hero-primary" onClick={() => { setAuthMode("register"); setView("auth"); }}>Jetzt registrieren →</button>
          <button className="btn-hero btn-hero-outline" onClick={() => { setAuthMode("login"); setView("auth"); }}>Einloggen</button>
        </div>
        <div className="hero-proof">✓ Kein Abo. Keine Kreditkarte. Kein Unsinn.</div>
        <div style={{marginTop:"14px",display:"flex",gap:"10px",flexWrap:"wrap",justifyContent:"center"}}>
          {["🚫 Keine Fake-Profile","💸 0€ für immer","✅ Verifizierte Nutzer","🔒 Kein Tracking"].map(t => (
            <div key={t} style={{padding:"5px 14px",borderRadius:"50px",background:"rgba(242,232,217,0.06)",border:"1px solid rgba(242,232,217,0.1)",fontSize:"0.74rem",color:"var(--cream3)"}}>
              {t}
            </div>
          ))}
        </div>
      </section>
      <div className="stats-bar">
        {[{n:"0",s:"",l:"Fake-Accounts"},{n:"0",s:" €",l:"Kosten — für immer"},{n:"0",s:"",l:"Versteckte Kosten"},{n:"100",s:"%",l:"Echte Menschen"}].map(s => (
          <div className="stat-item" key={s.l}><div className="stat-n">{s.n}<span>{s.s}</span></div><div className="stat-l">{s.l}</div></div>
        ))}
      </div>
      <footer className="footer">
        <div className="footer-logo">Get<span>Crush</span></div>
        <div className="footer-note">© 2026 GetCrush — getcrush.de</div>
        <div className="footer-links"><span className="f-link" style={{cursor:"pointer"}} onClick={() => setLegalPage("datenschutz")}>Datenschutz</span><span className="f-link" style={{cursor:"pointer"}} onClick={() => setLegalPage("impressum")}>Impressum</span></div>
      </footer>
    </div>
  );

  if (view === "auth") return (
    <div>
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
      <nav className="nav">
        <div className="logo" onClick={() => setView("landing")} style={{ cursor: "pointer" }}>Get<span>Crush</span></div>
      </nav>
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-title">{authMode === "login" ? "Willkommen zurück" : "Konto erstellen"}</div>
          <div className="auth-sub">{authMode === "login" ? "Einloggen und weitermachen" : "100% kostenlos — für immer"}</div>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <div className="auth-field">
            <label className="auth-label">E-Mail</label>
            <input className="auth-input" type="email" placeholder="deine@email.de" value={email} onChange={e => setEmail(e.target.value)}/>
          </div>
          <div className="auth-field">
            <label className="auth-label">Passwort</label>
            <input className="auth-input" type="password" placeholder="Mindestens 6 Zeichen" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleRegister())}/>
          </div>
          <button className="auth-btn" onClick={authMode === "login" ? handleLogin : handleRegister} disabled={loading}>
            {loading ? "Laden..." : authMode === "login" ? "Einloggen" : "Registrieren"}
          </button>
          <div className="auth-divider"><span>oder</span></div>
          <button className="auth-btn-google" onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            Mit Google {authMode === "login" ? "einloggen" : "registrieren"}
          </button>
          <div className="auth-switch">
            {authMode === "login"
              ? <>Noch kein Konto? <span onClick={() => { setAuthMode("register"); setError(""); setSuccess(""); }}>Registrieren</span></>
              : <>Bereits registriert? <span onClick={() => { setAuthMode("login"); setError(""); setSuccess(""); }}>Einloggen</span></>}
          </div>
          {authMode === "login" && (
            <div style={{textAlign:"center",marginTop:"10px"}}>
              <span onClick={handleResetPassword} style={{fontSize:"0.78rem",color:"var(--cream3)",cursor:"pointer",textDecoration:"underline"}}>
                Passwort vergessen?
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (view === "setup") return (
    <div style={{background:"#0a0806",minHeight:"100vh",color:"#f2e8d9"}}>
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
      <nav className="nav">
        <div className="logo">Get<span>Crush</span></div>
        <div className="nav-right"><button className="btn-nav-ghost" onClick={handleLogout}>Logout</button></div>
      </nav>
      <div className="auth-wrap">
        <div className="auth-card" style={{ maxWidth: "540px" }}>
          <div className="auth-title">Dein Profil</div>
          <div className="auth-sub">Nur einmal nötig — dann geht's los</div>
          {error && <div className="auth-error">{error}</div>}
          <div className="auth-field">
            <label className="auth-label">Fotos (bis zu 6)</label>
            <PhotoUpload
              session={session}
              photos={setupPhotos}
              onChange={(photos) => {
                setSetupPhotos(photos);
                if (photos[0]) setAvatarPreview(photos[0]);
              }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="auth-field">
              <label className="auth-label">Name *</label>
              <input className="auth-input" placeholder="Vorname" value={setupName} onChange={e => setSetupName(e.target.value)}/>
            </div>
            <div className="auth-field">
              <label className="auth-label">Alter *</label>
              <input className="auth-input" type="number" placeholder="25" min="18" max="99" value={setupAge} onChange={e => setSetupAge(e.target.value)}/>
              {setupAge && parseInt(setupAge) < 18 && <p style={{color:"#f08080",fontSize:"0.78rem",margin:"4px 0 0"}}>⚠️ Du musst mindestens 18 Jahre alt sein.</p>}
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-label">Stadt *</label>
            <input className="auth-input" placeholder="z.B. Berlin" value={setupCity} onChange={e => setSetupCity(e.target.value)}/>
          </div>
          <div className="auth-field">
            <label className="auth-label">Ich bin</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {["Mann","Frau","Divers"].map(g => (
                <button key={g} className={`i-tag ${setupGender === g ? "on" : ""}`} onClick={() => setSetupGender(g)}>{g}</button>
              ))}
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-label">Über mich</label>
            <textarea className="auth-input" placeholder="Schreib etwas über dich..." value={setupBio} onChange={e => setSetupBio(e.target.value)} style={{ resize: "vertical", minHeight: "80px" }}/>
          </div>
          <div className="auth-field">
            <label className="auth-label">Interessen</label>
            <div className="interest-grid">
              {INTERESTS.map(i => (
                <button key={i} className={`i-tag ${setupInterests.includes(i) ? "on" : ""}`} onClick={() => toggleI(i, setSetupInterests)}>{i}</button>
              ))}
            </div>
          </div>
          <button className="auth-btn" onClick={handleSetupSave} disabled={loading} style={{marginBottom:"24px"}}>
            {loading ? "Speichern..." : "Profil speichern & loslegen →"}
          </button>
          <hr style={{border:"none",borderTop:"1px solid rgba(242,232,217,0.08)",margin:"0 0 16px"}}/>
          <div style={{display:"flex",gap:"16px",justifyContent:"center"}}>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(window.Capacitor) { window.open("https://getcrush.de","_system"); } else { setLegalPage("impressum"); } }} style={{background:"none",border:"none",color:"#5a4a3a",fontSize:"0.72rem",cursor:"pointer",textDecoration:"underline",fontFamily:"var(--font-body)"}}>Impressum</button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(window.Capacitor) { window.open("https://getcrush.de","_system"); } else { setLegalPage("datenschutz"); } }} style={{background:"none",border:"none",color:"#5a4a3a",fontSize:"0.72rem",cursor:"pointer",textDecoration:"underline",fontFamily:"var(--font-body)"}}>Datenschutz</button>
          </div>

        </div>
      </div>
    </div>
  );

  // ── MAIN APP ──
  return (
    <div>
      <div className="bg-orbs"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
      <nav className="nav">
        <div className="logo">Get<span>Crush</span></div>
        <div className="nav-center">
          <button className={`nav-tab ${tab === "discover" ? "active" : ""}`} onClick={() => switchTab("discover")}>Entdecken</button>
          <button className={`nav-tab ${tab === "matches" || tab === "chat" ? "active" : ""}`} onClick={() => switchTab("matches")}>
            Matches {matches.length > 0 && <span className="nav-badge">{matches.length}</span>}
          </button>
          <button className={`nav-tab ${tab === "rooms" ? "active" : ""}`} onClick={() => switchTab("rooms")}>💬 Chaträume</button>
          <button className={`nav-tab ${tab === "map" ? "active" : ""}`} onClick={() => switchTab("map")}>🗺️ Karte</button>
        </div>
        <div className="nav-right">
          <div className="live-badge"><div className="live-dot"/><span style={{ fontSize: "0.78rem" }}>{profiles.filter(p => p.online).length} online</span></div>
          {me && <span style={{ fontSize: "0.8rem", color: "var(--cream3)" }}>Hey, {me.name} 👋</span>}
          <button className="btn-nav-ghost" onClick={() => { setView("setup"); setSetupName(me?.name||""); setSetupAge(me?.age||""); setSetupCity(me?.city||""); setSetupBio(me?.bio||""); setSetupInterests(me?.interests||[]); setSetupGender(me?.gender||""); setAvatarPreview(me?.avatar_url||null); setSetupPhotos(me?.photos||[]); }}>Profil</button>
          <button className="btn-nav-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="bottom-nav">
        <button className={`bottom-nav-item ${tab==="discover"?"active":""}`} onClick={() => switchTab("discover")}>
          <span className="bottom-nav-icon">🔍</span>
          <span className="bottom-nav-label">Entdecken</span>
        </button>
        <button className={`bottom-nav-item ${tab==="matches"||tab==="chat"?"active":""}`} onClick={() => switchTab("matches")}>
          <span className="bottom-nav-icon">💘{matches.length > 0 && <span className="nav-badge" style={{fontSize:"0.5rem",position:"absolute",top:"-2px",right:"-2px"}}>{matches.length}</span>}</span>
          <span className="bottom-nav-label">Matches</span>
        </button>
        <button className={`bottom-nav-item ${tab==="rooms"?"active":""}`} onClick={() => switchTab("rooms")}>
          <span className="bottom-nav-icon">💬</span>
          <span className="bottom-nav-label">Räume</span>
        </button>
        <button className={`bottom-nav-item ${tab==="map"?"active":""}`} onClick={() => switchTab("map")}>
          <span className="bottom-nav-icon">🗺️</span>
          <span className="bottom-nav-label">Karte</span>
        </button>
        <button className="bottom-nav-item" onClick={() => { setView("setup"); setSetupName(me?.name||""); setSetupAge(me?.age||""); setSetupCity(me?.city||""); setSetupBio(me?.bio||""); setSetupInterests(me?.interests||[]); setSetupGender(me?.gender||""); setAvatarPreview(me?.avatar_url||null); setSetupPhotos(me?.photos||[]); }}>
          <span className="bottom-nav-icon">👤</span>
          <span className="bottom-nav-label">Profil</span>
        </button>
      </div>

      {/* ── DISCOVER ── */}
      {tab === "discover" && (
        <div className="main-layout">
          <aside className="sidebar">
            <div className="s-card">
              <div className="s-label">Filter</div>
              <div className="s-row"><span className="s-key">Alter bis</span><span className="s-val">{ageMax} Jahre</span></div>
              <input type="range" min={18} max={60} value={ageMax} style={{ marginBottom: "18px" }} onChange={e => setAgeMax(+e.target.value)}/>
              <div className="s-label">Interessen</div>
              <div className="interest-grid">
                {INTERESTS.map(i => (
                  <button key={i} className={`i-tag ${filterInterests.includes(i) ? "on" : ""}`} onClick={() => toggleI(i, setFilterInterests)}>{i}</button>
                ))}
              </div>
            </div>
            {me && (
              <div className="s-card">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <img src={av(me)} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--terra)" }} alt=""/>
                  <div>
                    <div style={{ fontSize: "0.9rem", color: "var(--cream)", fontWeight: "500" }}>{me.name}, {me.age}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--cream3)" }}>📍 {me.city}</div>
                  </div>
                </div>
                <div className="free-note">✓ Kostenlos für immer<br/>Kein Abo. Kein Limit.</div>
              </div>
            )}
          </aside>
          <section className="grid-area">
            <div className="grid-header">
              <div><span className="grid-title">In deiner Nähe</span><span className="grid-count">{filtered.length} Profile</span></div>
              <select className="sort-select"><option>Neueste zuerst</option><option>Online zuerst</option></select>
            </div>
            {filtered.length === 0
              ? <div className="empty" style={{padding:"60px 20px",textAlign:"center"}}>
                  <div style={{fontSize:"3rem",marginBottom:"16px"}}>💘</div>
                  <div style={{fontFamily:"var(--font-display)",fontSize:"1.8rem",color:"var(--cream)",marginBottom:"12px",letterSpacing:"-0.02em"}}>
                    Wir haben gerade erst gestartet!
                  </div>
                  <div style={{fontSize:"0.95rem",color:"var(--cream3)",maxWidth:"380px",margin:"0 auto",lineHeight:"1.8",marginBottom:"28px",fontWeight:"300"}}>
                    GetCrush ist frisch live — noch wenige User, aber das ändert sich schnell.<br/>
                    Teile die App mit Freunden und lass den Funken überspringen. 🚀
                  </div>
                  <div style={{display:"flex",gap:"10px",justifyContent:"center",flexWrap:"wrap"}}>
                    <button onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title:"GetCrush", text:"Dating ohne Paywall — kostenlos für immer!", url:"https://getcrush.de" });
                      } else {
                        navigator.clipboard.writeText("https://getcrush.de");
                        alert("Link kopiert! 🎉");
                      }
                    }} style={{padding:"12px 28px",borderRadius:"50px",background:"var(--terra)",border:"none",color:"#fff",fontFamily:"var(--font-body)",fontSize:"0.9rem",fontWeight:"500",cursor:"pointer",transition:"all 0.2s"}}>
                      📤 App teilen
                    </button>
                    <button onClick={() => { setView("setup"); setSetupName(me?.name||""); setSetupAge(me?.age||""); setSetupCity(me?.city||""); setSetupBio(me?.bio||""); setSetupInterests(me?.interests||[]); setSetupGender(me?.gender||""); setAvatarPreview(me?.avatar_url||null); setSetupPhotos(me?.photos||[]); }}
                      style={{padding:"12px 28px",borderRadius:"50px",background:"transparent",border:"1px solid rgba(242,232,217,0.2)",color:"var(--cream2)",fontFamily:"var(--font-body)",fontSize:"0.9rem",cursor:"pointer"}}>
                      ✏️ Profil vervollständigen
                    </button>
                  </div>
                  <div style={{marginTop:"24px",fontSize:"0.78rem",color:"var(--cream3)"}}>
                    getcrush.de · 100% kostenlos · kein Abo · kein Bullshit
                  </div>
                </div>
              : (
                <div className="p-grid">
                  {filtered.map(p => (
                    <div className="p-card" key={p.id} onClick={() => setModal(p)}>
                      <div className="p-img-wrap">
                        <img src={av(p)} alt={p.name} className="p-img" loading="lazy"/>
                        {p.online && <div className="p-online"/>}
                        <div className="p-gradient">
                          <div className="p-name">{p.name}</div>
                          <div className="p-age">{p.age} Jahre</div>
                          <div className="p-city">📍 {p.city}</div>
                        </div>
                      </div>
                      <div className="p-body">
                        <div className="p-tags">{(p.interests || []).slice(0, 3).map(t => <span key={t} className="p-tag">{t}</span>)}</div>
                        <div className="p-actions" onClick={e => e.stopPropagation()}>
                          <button className="action-btn" onClick={e => e.stopPropagation()}>👎</button>
                          <button className={`action-btn action-like ${liked[p.id] ? "liked" : ""}`} onClick={e => handleLike(e, p)}>{liked[p.id] ? "❤️" : "🤍"}</button>
                          <button className="action-btn action-star" onClick={e => handleLike(e, p)}>⭐</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </section>
        </div>
      )}

      {/* ── MATCHES ── */}
      {(tab === "matches" || tab === "chat") && (
        <div className="matches-layout">
          <div className="matches-list" style={{display: mobileShowChat && (tab==="chat") ? "none" : "block"}}>
            <div className="matches-list-header">
              <div className="matches-list-title">Matches</div>
              <div className="matches-list-sub">{matches.length} gegenseitige Likes</div>
            </div>
            {matches.length === 0
              ? <div className="empty" style={{ padding: "40px 16px" }}><div className="empty-ico">💔</div><div className="empty-title" style={{ fontSize: "1rem" }}>Noch keine Matches</div><div className="empty-sub">Like Profile um Matches zu bekommen</div></div>
              : matches.map(p => (
                <div key={p.id} className={`match-item ${chatWith?.id === p.id ? "active" : ""}`} onClick={() => openChat(p)}>
                  <img src={av(p)} alt={p.name} className="match-avatar-sm"/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.88rem", color: "var(--cream)", fontWeight: "500" }}>{p.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--cream3)", marginTop: "2px" }}>📍 {p.city}</div>
                  </div>
                  {p.online && <div className="live-dot"/>}
                </div>
              ))
            }
          </div>
          {tab === "chat" && chatWith
            ? (
              <div className="chat-area">
                <div className="chat-header">
                  <button onClick={() => { setMobileShowChat(false); setChatWith(null); }} style={{
                      display:"flex", alignItems:"center", gap:"6px",
                      background:"rgba(242,232,217,0.08)", border:"1px solid rgba(242,232,217,0.12)",
                      borderRadius:"10px", color:"var(--cream2)", cursor:"pointer",
                      padding:"6px 12px", fontSize:"0.82rem", fontFamily:"var(--font-body)",
                      flexShrink:0, whiteSpace:"nowrap"
                    }}>← Matches</button>
                  <img src={av(chatWith)} alt={chatWith.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--terra)" }}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="chat-header-title">{chatWith.name}</div>
                    <div className="chat-header-sub" style={{ color: chatWith.online ? "var(--green)" : "var(--cream3)" }}>{chatWith.online ? "● Online" : "○ Offline"}</div>
                  </div>
                  {!chatWith.isAlfred && (
                    <button onClick={() => unmatch(chatWith)} style={{
                      padding:"6px 10px", borderRadius:"8px",
                      background:"rgba(191,64,64,0.12)", border:"1px solid rgba(191,64,64,0.3)",
                      color:"#f08080", fontSize:"0.75rem", cursor:"pointer",
                      fontFamily:"var(--font-body)", whiteSpace:"nowrap", flexShrink:0
                    }}>🗑 Match</button>
                  )}
                </div>
                <div className="chat-messages">
                  {messages.length === 0
                    ? <div style={{ textAlign: "center", color: "var(--cream3)", padding: "40px 0", fontSize: "0.85rem" }}>Schreib die erste Nachricht! 👋</div>
                    : messages.map(m => (
                      <div key={m.id} className={`msg ${m.from_user === session.user.id ? "msg-me" : "msg-them"}`}>
                        <div className="msg-bubble">{m.content}</div>
                        <div className="msg-time">{new Date(m.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    ))
                  }
                  <div ref={msgEnd}/>
                </div>
                <div className="chat-input-wrap">
                  <input className="chat-input" placeholder={`Nachricht an ${chatWith.name}...`} value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}/>
                  <button className="chat-send" onClick={sendMessage} disabled={!msgText.trim()}>→</button>
                </div>
              </div>
            )
            : <div className="matches-empty-chat"><div style={{ textAlign: "center", color: "var(--cream3)" }}><div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>💬</div><div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--cream2)" }}>Wähle ein Match</div><div style={{ fontSize: "0.85rem", marginTop: "8px" }}>Klick auf ein Match um zu chatten</div></div></div>
          }
        </div>
      )}

      {/* ── ROOMS ── */}
      {tab === "rooms" && (
        <div className="matches-layout">
          <div className="matches-list" style={{display: mobileShowChat && activeRoom ? "none" : "block"}}>
            <div className="matches-list-header">
              <div className="matches-list-title">💬 Chaträume</div>
              <div className="matches-list-sub">Öffentlich — für alle</div>
            </div>
            {(() => {
              const categories = [...new Set(rooms.map(r => r.category || "Sonstiges"))];
              const order = ["Flirten","Städte","Interessen","Sonstiges"];
              categories.sort((a,b) => (order.indexOf(a)+1||99) - (order.indexOf(b)+1||99));
              return categories.map(cat => (
                <div key={cat}>
                  <div className="room-category-label">{cat}</div>
                  {rooms.filter(r => (r.category || "Sonstiges") === cat).map(r => (
                    <div key={r.id} className={`room-item ${activeRoom?.id === r.id ? "active" : ""}`} onClick={() => openRoom(r)}>
                      <div className="room-emoji-box">{r.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="room-item-name">
                          {r.name}
                          {r.is_official && <span className="room-official">✓</span>}
                        </div>
                        <div className="room-item-desc">{r.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>

          {activeRoom
            ? (
              <div className="chat-area">
                <div className="chat-header" style={{flexWrap:"wrap",gap:"8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",flex:1,minWidth:0}}>
                    <button onClick={() => { setMobileShowChat(false); setActiveRoom(null); }} style={{
                      display:"flex", alignItems:"center", gap:"6px",
                      background:"rgba(242,232,217,0.08)", border:"1px solid rgba(242,232,217,0.12)",
                      borderRadius:"10px", color:"var(--cream2)", cursor:"pointer",
                      padding:"6px 12px", fontSize:"0.82rem", fontFamily:"var(--font-body)",
                      flexShrink:0, whiteSpace:"nowrap"
                    }}>← Räume</button>
                    <div style={{fontSize:"1.3rem",flexShrink:0}}>{activeRoom.emoji}</div>
                    <div style={{minWidth:0}}>
                      <div className="chat-header-title" style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                        {activeRoom.name}
                        {activeRoom.is_official && <span className="room-official">✓</span>}
                        <span style={{color:"var(--green)",fontSize:"0.7rem",display:"flex",alignItems:"center",gap:"3px"}}>
                          <div className="live-dot" style={{width:"5px",height:"5px"}}/>
                          {roomUserCount}
                        </span>
                      </div>
                      <div className="chat-header-sub" style={{color:"var(--cream3)",fontSize:"0.7rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {activeRoom.description}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                    <img src={ALFRED_AVATAR} alt="Alfred" style={{width:"22px",height:"22px",borderRadius:"50%",border:"1px solid var(--terra)"}}/>
                    <span style={{fontSize:"0.7rem",color:"var(--terra2)"}}>Alfred 🎩</span>
                    {!activeRoom.is_official && (
                      <button onClick={() => {
                        if (window.confirm(`Raum "${activeRoom.name}" wirklich löschen?`)) deleteRoom(activeRoom);
                      }} style={{padding:"6px 12px",borderRadius:"8px",background:"rgba(191,64,64,0.15)",border:"1px solid rgba(191,64,64,0.35)",color:"#f08080",fontSize:"0.78rem",cursor:"pointer",fontFamily:"var(--font-body)",display:"flex",alignItems:"center",gap:"4px",whiteSpace:"nowrap"}}>
                        🗑 Löschen
                      </button>
                    )}
                  </div>
                </div>
                <div className="chat-messages">
                  {roomMessages.length === 0
                    ? <div style={{ textAlign: "center", color: "var(--cream3)", padding: "40px 0", fontSize: "0.85rem" }}>Sei der Erste der schreibt!</div>
                    : roomMessages.map(m => {
                        const isMe = m.from_user === session.user.id;
                        const isAlfred = m.from_user === "alfred";
                        const name = isMe ? (me?.name || "Du") : (m.profiles?.name || "?");
                        const avatarSrc = isMe ? av(me) : av(m.profiles);
                        return (
                          <div key={m.id} className="msg msg-them" style={{maxWidth:"85%"}}>
                            <div className="msg-sender">
                              <img src={avatarSrc} alt=""
                                style={{border: isMe ? "1px solid var(--terra)" : isAlfred ? "1px solid var(--terra2)" : "none", cursor: !isMe ? "pointer" : "default"}}
                                onClick={() => !isMe && setUserPopup(isAlfred ? {
                                  id: "alfred",
                                  name: "Alfred",
                                  age: "∞",
                                  city: "Überall",
                                  bio: "Ihr persönlicher GetCrush-Butler. Stets zu Diensten. 🎩",
                                  avatar_url: ALFRED_AVATAR,
                                  interests: ["Etikette","Tee","Matchmaking","Potsdam"],
                                  isAlfred: true
                                } : m.profiles)}
                              />
                              <span style={{ color: isMe ? "var(--terra2)" : isAlfred ? "var(--gold)" : "var(--cream3)", fontWeight: isMe ? "600" : "400" }}>
                                {isAlfred ? "Alfred 🎩" : isMe ? `${name} (Du)` : name}
                              </span>
                            </div>
                            <div className={`msg-bubble ${isAlfred ? "msg-alfred-bubble" : isMe ? "msg-mine-group" : ""}`}>{m.content}</div>
                            <div className="msg-time">{new Date(m.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</div>
                          </div>
                        );
                      })
                  }
                  {alfredTyping && (
                    <div className="msg msg-them">
                      <div className="msg-sender">
                        <img src={ALFRED_AVATAR} alt="Alfred" style={{ width: "15px", height: "15px", borderRadius: "50%" }}/>
                        <span style={{ color: "var(--terra2)" }}>Alfred 🎩</span>
                      </div>
                      <div className="msg-bubble" style={{ background: "rgba(191,92,64,0.1)", color: "var(--cream3)" }}>
                        <div className="typing-dots"><span/><span/><span/></div>
                      </div>
                    </div>
                  )}
                  <div ref={roomMsgEnd}/>
                </div>
                <div style={{ position: "relative" }}>
                  {showCmds && (
                    <div className="cmd-palette">
                      <div className="cmd-palette-title">🎩 Alfred-Befehle</div>
                      {cmdFilter.map(c => (
                        <div key={c.cmd} className="cmd-item" onClick={() => { setRoomMsgText(c.cmd + " "); setShowCmds(false); document.getElementById("room-input").focus(); }}>
                          <span className="cmd-name">{c.cmd}</span>
                          <span className="cmd-desc">{c.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="chat-input-wrap">
                    <input
                      id="room-input"
                      className="chat-input"
                      placeholder={`Schreib in ${activeRoom.name}... (/ für Befehle)`}
                      value={roomMsgText}
                      onChange={e => {
                        const v = e.target.value;
                        setRoomMsgText(v);
                        if (v.startsWith("/")) {
                          const filtered = SLASH_COMMANDS.filter(c => c.cmd.startsWith(v.toLowerCase()));
                          setCmdFilter(filtered.length > 0 ? filtered : SLASH_COMMANDS);
                          setShowCmds(true);
                        } else {
                          setShowCmds(false);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") sendRoomMessage();
                        if (e.key === "Escape") setShowCmds(false);
                      }}
                    />
                    <button className="chat-send" onClick={sendRoomMessage} disabled={!roomMsgText.trim()}>→</button>
                  </div>
                </div>
              </div>
            )
            : (
              <div className="matches-empty-chat">
                <div style={{ textAlign: "center", color: "var(--cream3)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎩</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--cream2)" }}>Alfred wartet</div>
                  <div style={{ fontSize: "0.85rem", marginTop: "8px" }}>Wähle einen Raum links</div>
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* ── PROFILE MODAL ── */}
      {modal && (
        <div className="modal-bg" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <img src={av(modal)} alt={modal.name} className="modal-img"/>
            <button className="modal-close-btn" onClick={() => setModal(null)}>✕</button>
            <div className="modal-content">
              <div className="modal-name">{modal.name}</div>
              <div className="modal-meta">{modal.age} Jahre · {modal.city} {modal.online && "· 🟢 Online"}</div>
              <div className="modal-bio">{modal.bio || "Noch keine Bio angegeben."}</div>
              <div className="modal-tags">{(modal.interests || []).map(t => <span key={t} className="modal-tag">{t}</span>)}</div>
              <div className="modal-btns">
                <button className="m-btn m-btn-pass" onClick={() => setModal(null)}>Weiter 👎</button>
                <button className="m-btn m-btn-like" onClick={e => { handleLike(e, modal); setModal(null); }}>{liked[modal.id] ? "Gemocht ❤️" : "Like senden 🤍"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAP TAB ── */}
      {tab === "map" && (
        <div className="map-container" style={{height:"calc(100vh - 60px)"}}>
          <MapView session={session} me={me} />
        </div>
      )}

      {/* ── CREATE ROOM MODAL ── */}
      {showCreateRoom && (
        <div className="modal-bg" onClick={() => setShowCreateRoom(false)}>
          <div className="modal-box" style={{maxWidth:"420px"}} onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"}}>
                <img src={ALFRED_AVATAR} style={{width:"40px",height:"40px",borderRadius:"50%",border:"2px solid var(--terra)"}} alt="Alfred"/>
                <div>
                  <div className="modal-name" style={{fontSize:"1.4rem"}}>Raum erstellen</div>
                  <div style={{fontSize:"0.78rem",color:"var(--cream3)"}}>Alfred hilft Ihnen dabei 🎩</div>
                </div>
                <button className="modal-close-btn" style={{position:"static",marginLeft:"auto"}} onClick={() => setShowCreateRoom(false)}>✕</button>
              </div>
              {createError && <div className="auth-error" style={{marginBottom:"16px"}}>{createError}</div>}
              <div className="auth-field">
                <label className="auth-label">Raumname</label>
                <input className="auth-input" placeholder="z.B. Potsdam, Techno-Fans, ..." autoFocus value={newRoomName} onChange={e => { setNewRoomName(e.target.value); setCreateError(""); }} onKeyDown={e => e.key === "Enter" && createRoom()}/>
              </div>
              <div className="auth-field">
                <label className="auth-label">Kategorie</label>
                <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                  {["Flirten","Städte","Interessen","Sonstiges"].map(c => (
                    <button key={c} className={`i-tag ${newRoomCategory===c?"on":""}`} onClick={() => setNewRoomCategory(c)}>
                      {{"Flirten":"💘","Städte":"🏙️","Interessen":"🎯","Sonstiges":"🌟"}[c]} {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-btns" style={{marginTop:"8px"}}>
                <button className="m-btn m-btn-pass" onClick={() => setShowCreateRoom(false)}>Abbrechen</button>
                <button className="m-btn m-btn-like" onClick={createRoom} disabled={createLoading}>
                  {createLoading ? "Erstelle..." : "Raum erstellen →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SWITCH ROOM MODAL ── */}
      {showSwitchRoom && (
        <div className="modal-bg" onClick={() => setShowSwitchRoom(false)}>
          <div className="modal-box" style={{maxWidth:"440px",maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{borderBottom:"1px solid rgba(242,232,217,0.08)",paddingBottom:"16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <img src={ALFRED_AVATAR} style={{width:"36px",height:"36px",borderRadius:"50%",border:"2px solid var(--terra)"}} alt="Alfred"/>
                <div className="modal-name" style={{fontSize:"1.4rem",flex:1}}>Raum wechseln</div>
                <button className="modal-close-btn" style={{position:"static"}} onClick={() => setShowSwitchRoom(false)}>✕</button>
              </div>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {["Flirten","Städte","Interessen","Sonstiges"].map(cat => {
                const catRooms = rooms.filter(r => (r.category||"Sonstiges") === cat);
                if (!catRooms.length) return null;
                return (
                  <div key={cat}>
                    <div className="room-category-label" style={{position:"sticky",top:0}}>{cat}</div>
                    {catRooms.map(r => (
                      <div key={r.id} onClick={() => { setShowSwitchRoom(false); openRoom(r); }}
                        style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 22px",cursor:"pointer",transition:"background 0.15s",borderBottom:"1px solid rgba(242,232,217,0.04)","&:hover":{background:"rgba(242,232,217,0.04)"}, background: activeRoom?.id===r.id ? "rgba(191,92,64,0.12)" : "transparent"}}
                        onMouseEnter={e => e.currentTarget.style.background = activeRoom?.id===r.id ? "rgba(191,92,64,0.15)" : "rgba(242,232,217,0.04)"}
                        onMouseLeave={e => e.currentTarget.style.background = activeRoom?.id===r.id ? "rgba(191,92,64,0.12)" : "transparent"}>
                        <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"var(--bg3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0}}>{r.emoji}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:"0.88rem",color:"var(--cream)",fontWeight:"500",display:"flex",alignItems:"center",gap:"6px"}}>
                            {r.name}
                            {r.is_official && <span className="room-official">✓</span>}
                            {activeRoom?.id===r.id && <span style={{fontSize:"0.65rem",color:"var(--terra2)",background:"rgba(191,92,64,0.15)",padding:"1px 7px",borderRadius:"50px"}}>Aktuell</span>}
                          </div>
                          <div style={{fontSize:"0.72rem",color:"var(--cream3)",marginTop:"2px"}}>{r.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── INCOMING CRUSH NOTIFICATIONS ── */}
      {crushRequests.length > 0 && (
        <div style={{ position:"fixed", top:70, right:16, zIndex:2000, display:"flex", flexDirection:"column", gap:"10px", maxWidth:"320px" }}>
          {crushRequests.map(req => (
            <div key={req.id} style={{ background:"rgba(20,18,16,0.97)", backdropFilter:"blur(16px)", border:"1px solid rgba(191,92,64,0.4)", borderRadius:"18px", padding:"14px 16px", boxShadow:"0 8px 32px rgba(0,0,0,0.6)", animation:"toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)", display:"flex", alignItems:"center", gap:"12px" }}>
              <img src={av(req.profiles)} alt="" style={{ width:"44px", height:"44px", borderRadius:"50%", objectFit:"cover", border:"2px solid #bf5c40", flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"0.7rem", color:"#d97a5c", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.08em" }}>💘 Crush Anfrage!</div>
                <div style={{ fontSize:"0.88rem", color:"#f2e8d9", fontWeight:"500", marginTop:"2px" }}>{req.profiles?.name} will dich kennenlernen</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px", flexShrink:0 }}>
                <button onClick={() => respondCrush(req, true)} style={{ padding:"6px 12px", borderRadius:"8px", background:"#bf5c40", border:"none", color:"#fff", fontSize:"0.78rem", fontWeight:"500", cursor:"pointer", fontFamily:"system-ui" }}>✓ Ja</button>
                <button onClick={() => respondCrush(req, false)} style={{ padding:"6px 12px", borderRadius:"8px", background:"rgba(242,232,217,0.08)", border:"1px solid rgba(242,232,217,0.1)", color:"#8a7868", fontSize:"0.78rem", cursor:"pointer", fontFamily:"system-ui" }}>✕ Nein</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── USER PROFILE POPUP ── */}
      {userPopup && (
        <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(5,4,3,0.85)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={() => setUserPopup(null)}>
          <div style={{ background:"#1a1612", border:"1px solid rgba(242,232,217,0.1)", borderRadius:"24px", width:"100%", maxWidth:"340px", overflow:"hidden", boxShadow:"0 24px 60px rgba(0,0,0,0.8)", animation:"popUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
            onClick={e => e.stopPropagation()}>
            {/* Cover */}
            <div style={{ height:"120px", background:`linear-gradient(160deg, #1a1612, #0f0d0b)`, position:"relative" }}>
              <button onClick={() => setUserPopup(null)} style={{ position:"absolute", top:12, right:12, background:"rgba(242,232,217,0.1)", border:"none", color:"#f2e8d9", width:"28px", height:"28px", borderRadius:"50%", cursor:"pointer", fontSize:"0.9rem" }}>✕</button>
            </div>
            {/* Avatar */}
            <div style={{ display:"flex", justifyContent:"center", marginTop:"-44px", marginBottom:"12px" }}>
              <img src={av(userPopup)} alt="" style={{ width:"88px", height:"88px", borderRadius:"50%", objectFit:"cover", border:"3px solid #1a1612", boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}/>
            </div>
            {/* Info */}
            <div style={{ textAlign:"center", padding:"0 20px 20px" }}>
              <div style={{ fontFamily:"Georgia,serif", fontSize:"1.4rem", color:"#f2e8d9", fontWeight:"600" }}>{userPopup.name}{userPopup.age ? `, ${userPopup.age}` : ""}</div>
              {userPopup.city && <div style={{ fontSize:"0.8rem", color:"#8a7868", marginTop:"4px" }}>📍 {userPopup.city}</div>}
              {userPopup.bio && <div style={{ fontSize:"0.82rem", color:"#c4b09a", marginTop:"10px", lineHeight:"1.6", fontStyle:"italic" }}>"{userPopup.bio}"</div>}
              {userPopup.interests?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", justifyContent:"center", marginTop:"12px" }}>
                  {userPopup.interests.map(i => <span key={i} style={{ padding:"4px 10px", borderRadius:"50px", background:"rgba(242,232,217,0.07)", border:"1px solid rgba(242,232,217,0.1)", fontSize:"0.72rem", color:"#c4b09a" }}>{i}</span>)}
                </div>
              )}
              <div style={{ marginTop:"20px", display:"flex", gap:"10px" }}>
                <button onClick={() => setUserPopup(null)} style={{ flex:1, padding:"11px", borderRadius:"12px", background:"rgba(242,232,217,0.07)", border:"1px solid rgba(242,232,217,0.1)", color:"#c4b09a", fontFamily:"system-ui", fontSize:"0.86rem", cursor:"pointer" }}>
                  Schließen
                </button>
                {crushSent.find(c => c.to_user === userPopup.id)
                  ? <button disabled style={{ flex:2, padding:"11px", borderRadius:"12px", background:"rgba(191,92,64,0.2)", border:"1px solid rgba(191,92,64,0.3)", color:"#d97a5c", fontFamily:"system-ui", fontSize:"0.86rem" }}>
                      💘 Anfrage gesendet
                    </button>
                  : <button onClick={() => sendCrush(userPopup)} style={{ flex:2, padding:"11px", borderRadius:"12px", background:"#bf5c40", border:"none", color:"#fff", fontFamily:"system-ui", fontSize:"0.86rem", fontWeight:"500", cursor:"pointer" }}>
                      💘 Crush schicken
                    </button>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MATCH TOAST ── */}
      {matchToast && (
        <div className="match-toast" style={{ cursor: "pointer" }} onClick={() => { setMatchToast(null); openChat(matchToast); }}>
          <img src={av(matchToast)} alt={matchToast.name} className="toast-avatar"/>
          <div>
            <div className="toast-label">✨ Match!</div>
            <div className="toast-name">{matchToast.name}</div>
            <div className="toast-sub">Klick um zu chatten →</div>
          </div>
          <button className="toast-x" onClick={e => { e.stopPropagation(); setMatchToast(null); }}>✕</button>
        </div>
      )}
      {legalPage && <Legal page={legalPage} onClose={() => setLegalPage(null)} />}


      {showCookieBanner && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:99999,background:"rgba(20,18,16,0.97)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(242,232,217,0.12)",padding:"16px 24px",display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap",justifyContent:"space-between"}}>
          <p style={{color:"#c4b09a",fontSize:"0.82rem",margin:0,flex:1,minWidth:"200px"}}>
            🍪 Wir verwenden nur technisch notwendige Cookies. Keine Tracking- oder Werbe-Cookies. {" "}
            <span onClick={() => setLegalPage("datenschutz")} style={{color:"#bf5c40",cursor:"pointer",textDecoration:"underline"}}>Datenschutz</span>
          </p>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={() => { localStorage.setItem("gc_cookies_accepted","1"); setShowCookieBanner(false); }} style={{padding:"8px 20px",borderRadius:"8px",background:"#bf5c40",border:"none",color:"#fff",cursor:"pointer",fontFamily:"var(--font-body)",fontSize:"0.82rem",fontWeight:"600"}}>Akzeptieren</button>
            <button onClick={() => { localStorage.setItem("gc_cookies_accepted","1"); setShowCookieBanner(false); }} style={{padding:"8px 20px",borderRadius:"8px",background:"rgba(242,232,217,0.08)",border:"1px solid rgba(242,232,217,0.15)",color:"#c4b09a",cursor:"pointer",fontFamily:"var(--font-body)",fontSize:"0.82rem"}}>Nur notwendige</button>
          </div>
        </div>
      )}
    </div>
  );
}
