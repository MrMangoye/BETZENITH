// src/components/Layout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';

export default function Layout({
  topLeagues,
  allSportsWithLeagues,
  quickAccess,
  openAllSports,
  toggleAllSports,
  handleLeagueClick
}) {
  const location = useLocation();

  // Pages where left sidebar should appear
  const sidebarPages = ['/', '/pre-match', '/live', '/dashboard', '/deposit', '/withdraw',
                        '/bet-history', '/bet-slip', '/favorites', '/my-bets', '/analytics',
                        '/terms', '/privacy', '/responsible-gaming', '/login', '/register', '/auth'];

  const showLeftSidebar = sidebarPages.includes(location.pathname);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#0a0c14]">
        <div className="flex">
          {/* Left Sidebar - ALWAYS VISIBLE */}
          <Sidebar
            topLeagues={topLeagues}
            allSportsWithLeagues={allSportsWithLeagues}
            quickAccess={quickAccess}
            openAllSports={openAllSports}
            toggleAllSports={toggleAllSports}
            handleLeagueClick={handleLeagueClick}
          />

          {/* Main content - always has ml-64 for sidebar */}
          <main className="flex-1 ml-64 transition-all duration-300">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}