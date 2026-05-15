import { useState } from "react";

export default function Legal({ page, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,8,6,0.95)", zIndex: 9999,
      overflowY: "auto", padding: "40px 20px"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", color: "#c4b09a", fontFamily: "system-ui", lineHeight: 1.7 }}>
        <button onClick={onClose} style={{
          background: "rgba(242,232,217,0.08)", border: "1px solid rgba(242,232,217,0.15)",
          color: "#f2e8d9", padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
          marginBottom: "32px", fontSize: "0.85rem"
        }}>← Zurück</button>

        {page === "impressum" && <>
          <h1 style={{ color: "#f2e8d9", fontSize: "2rem", marginBottom: "32px" }}>Impressum</h1>
          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem" }}>Angaben gemäß § 5 TMG</h2>
          <p>Luis<br />Remer Quantum Corp<br />Teltow, Deutschland</p>
          <p>E-Mail: <a href="mailto:luisbinx34@gmail.com" style={{ color: "#bf5c40" }}>luisbinx34@gmail.com</a></p>
          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>Verantwortlich für den Inhalt</h2>
          <p>Luis</p>
          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>Haftungsausschluss</h2>
          <p>Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir keine Gewähr übernehmen.</p>
          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>Streitschlichtung</h2>
          <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" style={{ color: "#bf5c40" }} target="_blank">https://ec.europa.eu/consumers/odr</a></p>
        </>}

        {page === "agb" && <>
          <h1 style={{ color: "#f2e8d9", fontSize: "2rem", marginBottom: "32px" }}>Nutzungsbedingungen (AGB)</h1>
          
          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem" }}>1. Geltungsbereich</h2>
          <p>Diese Nutzungsbedingungen gelten für die Nutzung der App GetCrush (getcrush.de), betrieben von Luis, Remer Quantum Corp, Teltow.</p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>2. Mindestalter</h2>
          <p>GetCrush ist ausschließlich für Personen ab 18 Jahren. Die Nutzung durch Minderjährige ist strengstens untersagt.</p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>3. Verbotene Inhalte</h2>
          <p>Folgendes ist auf GetCrush ausdrücklich verboten:</p>
          <ul style={{paddingLeft:"20px", lineHeight:"2"}}>
            <li>Belästigung, Bedrohung oder Stalking anderer Nutzer</li>
            <li>Versenden von obszönen oder expliziten Inhalten ohne Zustimmung</li>
            <li>Fake-Profile oder falsche Identitäten</li>
            <li>Werbung oder kommerzielle Angebote</li>
            <li>Rassistische, diskriminierende oder hasserfüllte Inhalte</li>
            <li>Aufforderung zu illegalen Handlungen</li>
          </ul>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>4. Sicherheit</h2>
          <p>Triff dich mit Unbekannten immer an öffentlichen Orten. GetCrush übernimmt keine Haftung für Treffen die außerhalb der App stattfinden. Bei Gefahr: sofort 110 anrufen.</p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>5. Meldepflicht</h2>
          <p>Nutzer sind verpflichtet, verdächtige oder gefährliche Inhalte und Profile zu melden. Gemeldete Profile werden von uns geprüft und bei Verstößen gesperrt.</p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>6. Sperrung</h2>
          <p>Wir behalten uns das Recht vor, Nutzer bei Verstößen gegen diese AGB ohne Vorwarnung zu sperren.</p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>7. Haftung</h2>
          <p>GetCrush haftet nicht für Schäden die durch die Nutzung der App entstehen. Die Nutzung erfolgt auf eigene Gefahr.</p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>8. Kontakt</h2>
          <p>Bei Fragen: <a href="mailto:luisbinx34@gmail.com" style={{ color: "#bf5c40" }}>luisbinx34@gmail.com</a></p>

          <p style={{ marginTop: "32px", fontSize: "0.8rem", color: "#8a7868" }}>Stand: Mai 2026</p>
        </>}

        {page === "datenschutz" && <>
          <h1 style={{ color: "#f2e8d9", fontSize: "2rem", marginBottom: "32px" }}>Datenschutzerklärung</h1>
          
          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem" }}>1. Verantwortlicher</h2>
          <p>Luis, Remer Quantum Corp, Potsdam, Deutschland<br />
          E-Mail: luisbinx34@gmail.com</p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>2. Erhobene Daten</h2>
          <p>Wir erheben folgende Daten bei der Registrierung und Nutzung:</p>
          <ul>
            <li>E-Mail-Adresse und Passwort (verschlüsselt)</li>
            <li>Profilinformationen (Name, Alter, Stadt, Interessen)</li>
            <li>Profilfotos (freiwillig hochgeladen)</li>
            <li>Standortdaten (nur wenn aktiv freigegeben)</li>
            <li>Chat-Nachrichten (Ende-zu-Ende verschlüsselt)</li>
            <li>Push-Notification Token (für Benachrichtigungen)</li>
          </ul>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>3. Zweck der Datenverarbeitung</h2>
          <p>Deine Daten werden ausschließlich verwendet um:</p>
          <ul>
            <li>Die App-Funktionen bereitzustellen (Matching, Chat, Karte)</li>
            <li>Push-Benachrichtigungen zu senden</li>
            <li>Dein Konto zu verwalten</li>
          </ul>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>4. Datenweitergabe</h2>
          <p>Wir verkaufen oder teilen deine Daten <strong>niemals</strong> mit Dritten zu Werbezwecken. Daten werden nur an folgende Dienste weitergegeben:</p>
          <ul>
            <li><strong>Supabase</strong> (Datenbank, Server in Frankfurt/EU)</li>
            <li><strong>Firebase/Google</strong> (Push-Benachrichtigungen)</li>
          </ul>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>5. Datenspeicherung</h2>
          <p>Deine Daten werden auf Servern in der EU (Frankfurt) gespeichert. Du kannst dein Konto und alle Daten jederzeit löschen.</p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>6. Deine Rechte (DSGVO)</h2>
          <ul>
            <li>Recht auf Auskunft über deine gespeicherten Daten</li>
            <li>Recht auf Berichtigung falscher Daten</li>
            <li>Recht auf Löschung ("Recht auf Vergessenwerden")</li>
            <li>Recht auf Datenübertragbarkeit</li>
            <li>Widerspruchsrecht gegen die Verarbeitung</li>
          </ul>
          <p>Anfragen an: <a href="mailto:luisbinx34@gmail.com" style={{ color: "#bf5c40" }}>luisbinx34@gmail.com</a></p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>7. Cookies</h2>
          <p>Wir verwenden nur technisch notwendige Cookies für die Sitzungsverwaltung. Keine Tracking- oder Werbe-Cookies.</p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>8. Mindestalter</h2>
          <p>GetCrush ist ausschließlich für Personen ab 18 Jahren. Bei Verdacht auf Minderjährige wird das Konto sofort gesperrt.</p>

          <h2 style={{ color: "#bf5c40", fontSize: "1.1rem", marginTop: "24px" }}>9. Kontakt Datenschutz</h2>
          <p>Bei Fragen zum Datenschutz: <a href="mailto:luisbinx34@gmail.com" style={{ color: "#bf5c40" }}>luisbinx34@gmail.com</a></p>

          <p style={{ marginTop: "32px", fontSize: "0.8rem", color: "#8a7868" }}>Stand: Mai 2026</p>
        </>}
      </div>
    </div>
  );
}
