import { create } from 'zustand';
import { format } from 'date-fns';

export type ServiceStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  active: boolean;
  icon: string;
}

export interface Barber {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  status: ServiceStatus;
  completedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  stamps: number; // 0-10
  totalCuts: number;
  freeCouponAvailable: boolean;
  hasSeenFreeCutModal: boolean;
  appointments: string[];
  role?: string;
  commissionRate?: number;
  _id?: string;
  notifications?: any[];
}

export interface Transaction {
  id: string;
  appointmentId: string;
  amount: number;
  date: string;
  type: 'service' | 'coupon';
}

export interface Notification {
  id: string;
  type: 'info' | 'reward' | 'alert';
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
  title?: string;
}

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}


interface BarbershopState {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  clients: Client[];
  transactions: Transaction[];
  
  // Auth state
  currentUser: Client | null;
  isAdminMode: boolean;
  
  notifications: Notification[];
  isBookingFreeCut: boolean;
  activeTab: 'book' | 'status' | 'loyalty' | 'payments' | 'profile';
  currentClientId: string | null;
  
  // UI state
  showStampAnimation: boolean;
  stampAnimationCount: number;
  showFreeCoupon: boolean;
  settings: any;
  isGlobalLoading: boolean;
  loadingMessage: string;
  
  toast: Toast;
  showToast: (message: string, type?: Toast['type']) => void;
  hideToast: () => void;

  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string) => void;
  syncUser: () => Promise<any>;
  setCurrentUser: (user: Client | null, isAdmin: boolean) => void;
  setCurrentClient: (clientId: string | null) => void;
  logout: () => void;
  toggleAdminMode: () => void;
  
  addNotification: (type: Notification['type'], message: string, userId?: string) => void;
  markNotificationsRead: () => Promise<void>;
  setBookingFreeCut: (val: boolean) => void;
  setActiveTab: (tab: 'book' | 'status' | 'loyalty' | 'payments' | 'profile') => void;

  toggleService: (serviceId: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  startAppointment: (appointmentId: string) => void;
  completeAppointment: (appointmentId: string) => void;
  cancelAppointment: (appointmentId: string) => void;
  
  dismissStampAnimation: () => void;
  dismissFreeCoupon: () => void;
  setGlobalLoading: (val: boolean, message?: string) => void;
}

const today = format(new Date(), 'yyyy-MM-dd');

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export const useBarbershopStore = create<BarbershopState>((set, get) => ({
  services: [],
  barbers: [],
  appointments: [],
  clients: [],
  transactions: [],
  
  currentUser: null,
  isAdminMode: false,
  
  notifications: [],
  isBookingFreeCut: false,
  activeTab: (typeof window !== 'undefined' && (localStorage.getItem('gdc_active_tab') as any)) || 'book',
  currentClientId: null,
  
  showStampAnimation: false,
  stampAnimationCount: 0,
  showFreeCoupon: false,

  settings: null as any,
  isGlobalLoading: false,
  loadingMessage: 'CARREGANDO...',

  toast: { message: '', type: 'info', isVisible: false },
  showToast: (message, type = 'info') => {
    set({ toast: { message, type, isVisible: true } });
    // Auto hide after 3 seconds
    setTimeout(() => {
      get().hideToast();
    }, 4000);
  },
  hideToast: () => set(state => ({ toast: { ...state.toast, isVisible: false } })),

  
  syncUser: async () => {
    try {
      // Sync user, global settings and notifications in parallel
      const [userRes, settingsRes, notificationsRes] = await Promise.all([
        fetch('/api/users/me', { cache: 'no-store' }),
        fetch('/api/admin/settings', { cache: 'no-store' }),
        fetch('/api/users/notifications', { cache: 'no-store' })
      ]);

      if (userRes.ok) {
        const user = await userRes.json();
        const mappedUser = {
          ...user,
          id: user._id || user.id,
        };
        set((state) => ({
          currentUser: mappedUser,
          isAdminMode: state.currentUser ? state.isAdminMode : mappedUser.role === 'admin',
        }));
      }

      if (notificationsRes.ok) {
        const dbNotifs = await notificationsRes.json();
        const mappedNotifs = dbNotifs.map((n: any) => ({
          id: n._id || n.id,
          type: n.type || 'info',
          title: n.title,
          message: n.message,
          timestamp: format(new Date(n.date || n.createdAt), 'HH:mm'),
          read: n.read,
          userId: n.userId
        }));

        set({ notifications: mappedNotifs });
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        set({ settings });
      }
    } catch (err) {
      console.error('Error syncing data:', err);
    }
  },

  login: async (email, password) => {
    // Attempt to sync with DB first
    const res = await fetch('/api/users/me');
    if (res.ok) {
        const user = await res.json();
        const isAdmin = user.role === 'admin';
        const isEligibleForModal = user.freeCouponAvailable && !user.hasSeenFreeCutModal;
        set({ currentUser: user, isAdminMode: isAdmin, showFreeCoupon: isEligibleForModal });
        return true;
    }

    // Fallback to mock for development if DB fails
    const state = get();
    const user = state.clients.find(c => c.email === email && c.password === password);
    if (user) {
      const isAdmin = user.role === 'admin';
      const isEligibleForModal = user.freeCouponAvailable && !user.hasSeenFreeCutModal;
      
      set({ 
        currentUser: user,
        isAdminMode: isAdmin,
        showFreeCoupon: isEligibleForModal
      });
      return true;
    }
    return false;
  },

  register: (name, email, phone, password) => {
    // Legacy mock function - kept for fallback if needed
  },

  setCurrentUser: (user, isAdmin) => {
    set({ currentUser: user, isAdminMode: isAdmin });
  },
  
  setCurrentClient: (clientId) => set({ currentClientId: clientId }),

  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('gdc_active_tab');
    set({ currentUser: null, isAdminMode: false, isBookingFreeCut: false, activeTab: 'book' });
  },
  
  toggleAdminMode: () => {
    const { currentUser } = get();
    if (currentUser?.role === 'admin') {
      set(state => ({ isAdminMode: !state.isAdminMode }));
    }
  },

  addNotification: (type, message, userId) => {
    const id = generateId();
    set(state => ({
      notifications: [{ id, type, message, timestamp: format(new Date(), 'HH:mm'), read: false, userId }, ...state.notifications]
    }));
  },

  markNotificationsRead: async () => {
    const { currentUser } = get();
    
    // Optimistic update
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));

    // DB update
    try {
        await fetch('/api/users/notifications/read', { method: 'POST' });
    } catch (err) {
        console.error('Failed to sync notification read status:', err);
    }
  },

  setBookingFreeCut: (val) => set({ isBookingFreeCut: val }),
  setActiveTab: (tab) => {
    if (typeof window !== 'undefined') localStorage.setItem('gdc_active_tab', tab);
    set({ activeTab: tab });
  },

  toggleService: (serviceId) => {
    set((state) => ({
      services: state.services.map((s) =>
        s.id === serviceId ? { ...s, active: !s.active } : s
      ),
    }));
  },

  addAppointment: (appointment) => {
    const id = generateId();
    const state = get();
    
    // If it was a free cut, consume the coupon
    if (state.isBookingFreeCut && state.currentUser) {
        const updatedClients = state.clients.map(c => 
            c.id === state.currentUser?.id ? { ...c, freeCouponAvailable: false } : c
        );
        const nextCurrentUser = { ...state.currentUser, freeCouponAvailable: false };
        set({ clients: updatedClients, currentUser: nextCurrentUser, isBookingFreeCut: false });
    }

    set((state) => ({
      appointments: [...state.appointments, { ...appointment, id }],
    }));
  },

  startAppointment: (appointmentId) => {
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'in-progress' } : a
      ),
    }));
  },

  completeAppointment: async (appointmentId) => {
    const { setGlobalLoading } = get();
    setGlobalLoading(true, 'FINALIZANDO ATENDIMENTO...');
    
    // Artificial delay for premium feel
    await new Promise(r => setTimeout(r, 1500));

    const state = get();
    const appointment = state.appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    const service = state.services.find((s) => s.id === appointment.serviceId);
    const now = format(new Date(), 'HH:mm');

    // Update appointment
    const updatedAppointments = state.appointments.map((a) =>
      a.id === appointmentId ? { ...a, status: 'completed' as ServiceStatus, completedAt: now } : a
    );

    // Update client stamps
    let showFreeCoupon = false;
    const updatedClients = state.clients.map((c) => {
      if (c.id === appointment.clientId) {
        const nextStamps = c.stamps + 1;
        const reachedTen = nextStamps >= 10;
        if (reachedTen) showFreeCoupon = true;
        
        return {
          ...c,
          stamps: reachedTen ? 0 : nextStamps,
          totalCuts: c.totalCuts + 1,
          freeCouponAvailable: reachedTen ? true : c.freeCouponAvailable,
          hasSeenFreeCutModal: reachedTen ? false : c.hasSeenFreeCutModal, // Reset seen flag if new reward
        };
      }
      return c;
    });

    const targetClient = updatedClients.find(c => c.id === appointment.clientId);
    const displayStamps = showFreeCoupon ? 10 : (targetClient?.stamps || 0);

    // Notifications logic
    const nextNotifications = [...state.notifications];
    if (showFreeCoupon) {
      // Notify Admin
      nextNotifications.unshift({
        id: generateId(),
        type: 'reward',
        message: `🏆 O cliente ${appointment.clientName} completou 10 cortes e ganhou um CORTE GRÁTIS!`,
        timestamp: now,
        read: false
      });
      // Notify Client (for their bell later)
      nextNotifications.unshift({
        id: generateId(),
        type: 'reward',
        message: `🎉 Parabéns! Você ganhou um CORTE GRÁTIS por sua fidelidade!`,
        timestamp: now,
        read: false,
        userId: appointment.clientId
      });
    }

    // If completing for current logged user, update current user state too
    const nextCurrentUser = state.currentUser?.id === appointment.clientId 
      ? updatedClients.find(c => c.id === appointment.clientId) || null 
      : state.currentUser;

    set({
      appointments: updatedAppointments,
      clients: updatedClients,
      currentUser: nextCurrentUser,
      notifications: nextNotifications,
      transactions: [...state.transactions, { id: generateId(), appointmentId, amount: service?.price ?? 0, date: today, type: 'service' }],
      showStampAnimation: true,
      stampAnimationCount: displayStamps,
      showFreeCoupon,
    });

    setGlobalLoading(false);
  },

  cancelAppointment: (appointmentId) => {
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'cancelled' } : a
      ),
    }));
  },

  dismissStampAnimation: () => set({ showStampAnimation: false }),
  dismissFreeCoupon: () => {
    const state = get();
    if (state.currentUser) {
      const updatedClients = state.clients.map(c => 
        c.id === state.currentUser?.id ? { ...c, hasSeenFreeCutModal: true } : c
      );
      set({ 
        clients: updatedClients, 
        currentUser: { ...state.currentUser, hasSeenFreeCutModal: true },
        showFreeCoupon: false 
      });
    } else {
      set({ showFreeCoupon: false });
    }
  },
  setGlobalLoading: (val, message) => set({ 
    isGlobalLoading: val, 
    loadingMessage: message || 'CARREGANDO...' 
  }),
}));

