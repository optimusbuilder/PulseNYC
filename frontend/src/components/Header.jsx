export default function Header() {
  return (
    <header className="app-header">
      <div className="header-brand">
        <h1>Pulse<span className="accent">NYC</span></h1>
        <p className="tagline">Live city intelligence</p>
      </div>
      <div className="header-legend">
        <span className="legend-dot calm" /> Calm
        <span className="legend-dot elevated" /> Elevated
        <span className="legend-dot active" /> Active
      </div>
    </header>
  );
}
