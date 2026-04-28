'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import ClientView from '@/components/client/ClientView';
import AdminView from '@/components/admin/AdminView';
import BarberDashboard from '@/components/barber/BarberDashboard';
import AuthView from '@/components/shared/AuthView';
import StampAnimationOverlay from '@/components/shared/StampAnimationOverlay';
import FreeCouponModal from '@/components/shared/FreeCouponModal';

import BarberLoading from '@/components/shared/BarberLoading';
import AnnouncementPopup from '@/components/shared/AnnouncementPopup';
import { useState } from 'react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const { currentUser, isAdminMode, setCurrentUser, settings, syncUser } = useBarbershopStore();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [lastShownUserId, setLastShownUserId] = useState<string | null>(null);

  // Sync settings and show announcement
  useEffect(() => {
    syncUser();
  }, [syncUser]);

  // Trigger announcement once per user login
  useEffect(() => {
    const currentId = currentUser?._id || currentUser?.id;
    if (settings?.announcementEnabled && currentId && currentId !== lastShownUserId) {
      setShowAnnouncement(true);
      setLastShownUserId(currentId);
    }
  }, [settings?.announcementEnabled, currentUser?.id, lastShownUserId]);

  useEffect(() => {
    if (status === 'authenticated' && !currentUser) {
      fetch('/api/users/me')
        .then(res => res.json())
        .then(data => {
          if (data._id) {
            const mappedUser = {
              id: data._id,
              name: data.name,
              email: data.email,
              phone: data.phone,
              stamps: data.stamps,
              totalCuts: data.totalCuts,
              freeCouponAvailable: data.freeCouponAvailable,
              hasSeenFreeCutModal: data.hasSeenFreeCutModal,
              appointments: [],
              role: data.role
            };
            setCurrentUser(mappedUser, data.role === 'admin');
          }
        })
        .catch(err => console.error('Error fetching user', err));
    }
  }, [status, currentUser, setCurrentUser]);

  if (status === 'loading' || (status === 'authenticated' && !currentUser)) {
    return <BarberLoading message="CARREGANDO CLUBE GIGANTES..." />;
  }

  return (
    <main className="min-h-screen relative flex flex-col overflow-x-hidden selection:bg-orange-500/30">
      {/* ── Visual Layers ── */}
      <div className="luxury-bg" />
      
      {/* Removed the top glow orb to eliminate the brown tint at the top */}
      <div className="glow-orb bottom-[-300px] right-[-100px] opacity-30" />

      {!currentUser ? (
        <AuthView />
      ) : (
        <>
          {/* ── Premium Header (Client Only) - Removed top glow by hiding global header for admin ── */}
          {!isAdminMode && currentUser?.role !== 'barber' && (
            <header className="sticky top-0 z-[100] px-6 py-6 md:py-8 pointer-events-none">
                {/* Global header hidden elements or just padding */}
            </header>
          )}

          {/* ── Main Stage ── */}
          <section className={`flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-10 ${isAdminMode ? 'py-0' : 'py-0 md:py-4'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={isAdminMode ? 'admin' : currentUser?.role === 'barber' ? 'barber' : 'client'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 flex flex-col"
              >
                {isAdminMode ? <AdminView /> : currentUser?.role === 'barber' ? <BarberDashboard /> : <ClientView />}
              </motion.div>
            </AnimatePresence>
          </section>
        </>
      )}

      {!isAdminMode && currentUser?.role !== 'barber' && (
        <>
            <StampAnimationOverlay />
            <FreeCouponModal />
        </>
      )}

      {/* ── Global Announcement Popup ── */}
      <AnimatePresence>
        {showAnnouncement && settings?.announcementEnabled && (
          <AnnouncementPopup 
            text={settings.announcementText}
            image={settings.announcementImage}
            onClose={() => setShowAnnouncement(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Bottom Fade ── */}
      <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-[10]" />
    </main>
  );
}
