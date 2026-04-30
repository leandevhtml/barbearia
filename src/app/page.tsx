'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import ClientView from '@/components/client/ClientView';
import AdminView from '@/components/admin/AdminView';
import BarberDashboard from '@/components/barber/BarberDashboard';
import AuthView from '@/components/shared/AuthView';
import StampAnimationOverlay from '@/components/shared/StampAnimationOverlay';
import FreeCouponModal from '@/components/shared/FreeCouponModal';

import AnnouncementPopup from '@/components/shared/AnnouncementPopup';
import { useState } from 'react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const { currentUser, isAdminMode, setCurrentUser, settings, syncUser } = useBarbershopStore();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [hasDismissedAnnouncement, setHasDismissedAnnouncement] = useState(false);
  const [autoAnnouncement, setAutoAnnouncement] = useState<{text: string, image: string} | null>(null);

  // Sync settings
  useEffect(() => {
    syncUser();
  }, [syncUser]);

  // Trigger announcement once per user login (Manual or Auto-warning)
  useEffect(() => {
    const currentId = currentUser?._id || currentUser?.id;
    if (!currentId || !settings) return;

    // 1. Check Global Manual Announcement
    if (settings.announcementEnabled && !hasDismissedAnnouncement) {
      setAutoAnnouncement(null); // Clear auto if manual is active
      setShowAnnouncement(true);
      return;
    }

    // 2. Auto-Warning for Tomorrow's Closure (Shown 1 day before)
    if (!hasDismissedAnnouncement) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
      
      const specialTomorrow = settings.specialDays?.find((s: any) => s.date === tomorrowStr && s.isClosed);
      
      if (specialTomorrow) {
        const dateFmt = new Date(specialTomorrow.date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        setAutoAnnouncement({
          text: `⚠️ AVISO: Amanhã (${dateFmt}) a barbearia não funcionará devido ao feriado/folga. Antecipe seu agendamento!`,
          image: '/announcements/feriado.png'
        });
        setShowAnnouncement(true);
      }
    }
  }, [settings, currentUser?.id, hasDismissedAnnouncement]);

  useEffect(() => {
    if (status === 'authenticated' && !currentUser) {
      fetch('/api/users/me')
        .then(res => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 404) {
              console.error('Session invalid or user not found, signing out...');
              signOut({ redirect: false });
            }
            throw new Error(`Failed to fetch user: ${res.status}`);
          }
          return res.json();
        })
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
        .catch(err => {
          console.error('Error fetching user', err);
        });
    }
  }, [status, currentUser, setCurrentUser]);

  // Combined loading check is now handled by Providers for a smoother transition

  return (
    <main className="min-h-dvh relative flex flex-col overflow-x-hidden selection:bg-orange-500/30">
      {/* ── Visual Layers ── */}
      <div className="luxury-bg" />
      
      {/* Removed the top glow orb to eliminate the brown tint at the top */}
      <div className="glow-orb bottom-[-300px] right-[-100px] opacity-30" />

      {!currentUser ? (
        <AuthView />
      ) : (
        <>
          {/* ── Main Stage ── */}
          <section className="flex-1 w-full max-w-screen-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={isAdminMode ? 'admin' : currentUser?.role === 'barber' ? 'barber' : 'client'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
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
        {showAnnouncement && (settings?.announcementEnabled || autoAnnouncement) && !hasDismissedAnnouncement && (
          <AnnouncementPopup 
            text={settings?.announcementEnabled ? settings.announcementText : autoAnnouncement?.text || ''}
            image={settings?.announcementEnabled ? settings.announcementImage : autoAnnouncement?.image || ''}
            onClose={() => {
              setShowAnnouncement(false);
              setHasDismissedAnnouncement(true);
            }}
          />
        )}
      </AnimatePresence>

    </main>
  );
}
