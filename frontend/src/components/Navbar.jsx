import React from 'react';

export default function Navbar({ user, page, setPage, onLogout }) {
  const items = [
    ['reception', 'Reception'],
    ['doctor', 'Doctor'],
    ['lobby', 'Lobby TV'],
    ['public', 'Public Booking']
  ];
  if (user?.role === 'admin') items.push(['admin', 'Admin']);

  return (
    <header className="topbar">
      <div className="brand"><span className="brand-dot" /> PulseQ</div>
      <div className="nav-actions">
        {items.map(([key, label]) => (
          <button key={key} className={page === key ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage(key)}>{label}</button>
        ))}
        <button className="nav-btn logout" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
