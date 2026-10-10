import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="app-wrapper d-flex flex-column min-vh-100">
      <Header />
      <main className="main-content flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
