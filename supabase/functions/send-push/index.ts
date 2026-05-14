import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://voqqmeipwsprmducxbux.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvcXFtZWlwd3Nwcm1kdWN4YnV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY4NDEyMCwiZXhwIjoyMDk0MjYwMTIwfQ.WQSF0FQGIZCIoJ_gb3GJaVlLSeKSKa2v54MGp1IpYI8";
const FCM_PROJECT_ID = "getcrush-a54ae";
const FCM_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@getcrush-a54ae.iam.gserviceaccount.com";
const FCM_TOKEN_URI = "https://oauth2.googleapis.com/token";
const FCM_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCpN3rWooG2Bsbp\neJxL5CXL2JpmwwGL9pPx+C4zKegLhHjizPeuXCkUIF90QXKhtxFOQKV8Lzhuy/V5\niiUn3LpO+QfZKfjaSMAs3y9AepCV+4xbXBbwaMttwvjIt++0MXfObEXEXtR7pPxN\n8dw2KX/Eb4ZG/0wA6IWY+6MFU0Alphh8CGCOUsCEXXHLbI3zWdWOsCGpWt/aNK3h\nsTjtuGE/c7MluHbiY8KIXXAZYBJ28nOJ0eGO/ngGvdb3SFZY3MGAsICGQjLYNh+J\nsPVI3jxckBQfxrIJwGr8ypt9r4NV8U1SFPR0C/HmC8nfObCzGat+5B/aaTfegDff\noTKdJNjFAgMBAAECggEADkN9MQDvPpz5IN54DESds/5c23smEvp0s5GIMWtfojLn\nLrT4zsN5efcVnLrUkxGXnZlA6cQgNWSvWzCcG61VLgl7UiCh16KIwm+Ir950+BOF\nXAEZ9OdceHLWHjM0+yMtVmLVia01q3t3ggl4Vr9uQ+xjrPHhofT3p/LUJcOD9XhU\n0KBQ3EkZZAK+J74GtpuB+7e6Ri9EqMiTAAqpTz14JxMsOxjtQ4XmOMkZlvThj6an\nJeb2tPRc45pGZwAIRPZxtIJ3m6issGChUr1cF+RtRietBj2J1kaPNQ3ehaKU7Tzu\npvmbnFMkE1R5o6xksSPza81pDFkaSQ6WBXECTKkfaQKBgQDd0yfdMYlgZD6wnBh/\nfaCSDPG1fezE9NS7mYHGbSP41QaMu38mYzq/hEjllRI/LH+2/YSCz+pS1HyCinbu\nPLslyISkW8fRk5vjJnMerUH8ULMFaiUESs2JVHlstGfD2JYoIuGyvono82HjWar/\n/Y2Bklfgctilg+cuR+PpkMYC7QKBgQDDSXFmOIPVG8rqc8zwe4d9NtjHiQaQIvxw\nWP/rdQoYnT9cyKL6iUc3AIscU5nP+dbmjcG9PWDS7knPWvfVi3HCUt+K1NaPPGiS\ncv0zPmH0+ExcTM4U3RBPE0HgBIjACuNtktJUicj29RIxTzWVH3/5I2OIRo0f6y0v\nuu8gKua6OQKBgQDPNabgTZy5KQsSaM3NkemDZIoI8ldQ6C8sCsoaM+tNTpjur1qn\n3juLmSOLKgRAdO3cXtcAZv3JX+nq+zL7ekmLktKswXtXfx44Qrt4pXmlGzEPVsa7\nSrDSntFKRP9FB7XESkkwciJbM7Z17FX7CLu9lJl39XAAtMUoC0mP7Ye6RQKBgQCn\nJg93rNu55gXyUpeRJko7tFwrvW7uo+NpzeOOhyjTFJSNN/W3dxSLUV3AKxY12uRD\nhgXTkdtz7x0h6/zAvI/sAb7wN2hGRTBEWUO7PqPdZ0EEp4CkfupcpGD3+ymJJkiv\nGsIINb7bEbw2lFOKheGlPtMMa0aTkVmlxtyxrca6kQKBgQCXF7qdJxmw9HPa3jmx\nYaVoEfMtIvYdMrx00chmTT+184ATk2/43mADhBYfv47R7e/+QtyhNBeR3muFUHkJ\ntYXacFKLkMEEiaqVLzoWuUe/DutE2I31hE+D+Oc7JLO8IWfuoF3zOcPBYcDIUDIa\ntkKGLS/5rA/2+SjHfHizWYcabQ==\n-----END PRIVATE KEY-----\n";

async function getFCMToken() {
  const now = Math.floor(Date.now() / 1000);
  const enc = (obj) => btoa(JSON.stringify(obj)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const header = enc({ alg: "RS256", typ: "JWT" });
  const payload = enc({ iss: FCM_CLIENT_EMAIL, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: FCM_TOKEN_URI, iat: now, exp: now + 3600 });
  const signingInput = `${header}.${payload}`;
  const pemKey = FCM_PRIVATE_KEY.replace(/\\n/g, "\n");
  const keyData = pemKey.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}`;
  const res = await fetch(FCM_TOKEN_URI, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
  const data = await res.json();
  return data.access_token;
}

async function sendPush(token, title, body, data) {
  const accessToken = await getFCMToken();
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token, notification: { title, body }, android: { notification: { sound: "default" } }, data: data ? Object.fromEntries(Object.entries(data).map(([k,v]) => [k, String(v)])) : {} } }),
  });
  return res.json();
}

serve(async (req) => {
  const { type, to_user_id, from_name, message } = await req.json();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: profile } = await supabase.from("profiles").select("push_token").eq("id", to_user_id).single();
  if (!profile?.push_token) return new Response(JSON.stringify({ ok: true }), { status: 200 });
  const titles = { like: "💘 Jemand mag dich!", match: "🎉 Neues Match!", message: `💬 ${from_name}`, crush: "💘 Crush Anfrage!" };
  const bodies = { like: `${from_name} hat dich geliked`, match: `Du und ${from_name} habt gematcht!`, message: message || "Neue Nachricht", crush: `${from_name} möchte dich kennenlernen` };
  const result = await sendPush(profile.push_token, titles[type] || "GetCrush", bodies[type] || "", { type, from_name });
  return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
});
