import "./App.css";
import { VoiceAgent } from "./components/VoiceAgent";

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Realtime Voice MVP - LiveKit</h1>
        <p>Voice AI con turn detection inteligente</p>
      </header>

      <main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <section className="panel" style={{ maxWidth: '600px', width: '100%' }}>
          <VoiceAgent />
        </section>
      </main>

      <footer className="footer">
        Powered by LiveKit Agents · Silero VAD · Deepgram STT
      </footer>
    </div>
  );
}

export default App;
