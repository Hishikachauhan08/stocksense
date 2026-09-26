import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import {
  Product,
  Receipt,
  DeliveryOrder,
  InternalTransfer,
  StockAdjustment,
  StockMoveHistory,
  Warehouse,
  UserProfile,
  Role,
  DashboardKPIs,
  FilterOptions,
  LowStockAlert,
  OperationStatus,
} from '../types/inventory';
import { sound } from '../utils/audio';
import { api, ApiError, tokenStore } from '../lib/api';

const SOUND_KEY = 'stocksense_sound';
const REFRESH_INTERVAL_MS = 15000;

interface InventoryState {
  warehouses: Warehouse[];
  products: Product[];
  receipts: Receipt[];
  deliveries: DeliveryOrder[];
  transfers: InternalTransfer[];
  adjustments: StockAdjustment[];
  moveHistory: StockMoveHistory[];
  users: UserProfile[];
}

const EMPTY_STATE: InventoryState = {
  warehouses: [],
  products: [],
  receipts: [],
  deliveries: [],
  transfers: [],
  adjustments: [],
  moveHistory: [],
  users: [],
};

// Shown in place of a signed-in user while nobody is logged in
const GUEST_USER: UserProfile = {
  id: '',
  name: 'Guest',
  email: '',
  role: 'warehouse_staff',
  avatar: '',
  warehouseId: '',
};

// Initials avatar for accounts without a photo
function withAvatar(u: UserProfile): UserProfile {
  if (u.avatar) return u;
  const initials = u.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#e7e5e4"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="700" fill="#44403c">${initials}</text></svg>`;
  return { ...u, avatar: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` };
}

type Notice = { id: number; kind: 'error' | 'success'; message: string };

type NewProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalStock'> & {
  initialLocationStocks?: { warehouseId: string; locationId: string; quantity: number }[];
};

interface InventoryContextType {
  // Auth
  user: UserProfile;
  isAuthenticated: boolean;
  authChecking: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; role: Role }) => Promise<void>;
  logout: () => void;
  requestPasswordOtp: (email: string) => Promise<{ devOtp?: string; emailSent: boolean; expiresInSeconds: number }>;
  verifyPasswordOtp: (email: string, otp: string) => Promise<string>;
  resetPasswordWithToken: (resetToken: string, password: string) => Promise<void>;

  role: Role;
  users: UserProfile[];
  activeView: 'landing' | 'app';
  setActiveView: (view: 'landing' | 'app') => void;
  warehouses: Warehouse[];
  products: Product[];
  receipts: Receipt[];
  deliveries: DeliveryOrder[];
  transfers: InternalTransfer[];
  adjustments: StockAdjustment[];
  moveHistory: StockMoveHistory[];
  kpis: DashboardKPIs;
  publicSummary: { totalUnitsInStock: number; totalProductsCount: number; warehousesCount: number };
  lowStockAlerts: LowStockAlert[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isSyncing: boolean;
  refresh: () => Promise<void>;
  notify: (message: string, kind?: Notice['kind']) => void;

  // Active Filter state
  activeFilters: FilterOptions;
  setActiveFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;

  // Staff Account Provisioning (Inventory Manager only)
  createStaffAccount: (data: {
    name: string;
    email: string;
    role: Role;
    warehouseId: string;
    temporaryPassword?: string;
  }) => Promise<{ user: UserProfile; temporaryPassword: string } | null>;
  updateMyProfile: (updates: {
    name?: string;
    email?: string;
    warehouseId?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<boolean>;
  deleteUserAccount: (userId: string) => Promise<boolean>;

  // Product Operations
  addProduct: (product: NewProduct) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;

  // Receipt Operations
  createReceipt: (data: Omit<Receipt, 'id' | 'referenceNumber' | 'status' | 'createdAt'>) => Promise<boolean>;
  updateReceiptStatus: (id: string, status: OperationStatus) => Promise<boolean>;
  validateReceipt: (id: string) => Promise<boolean>;

  // Delivery Operations
  createDelivery: (
    data: Omit<DeliveryOrder, 'id' | 'referenceNumber' | 'status' | 'isPicked' | 'isPacked' | 'createdAt'>
  ) => Promise<boolean>;
  updateDeliveryPicking: (id: string, isPicked: boolean) => Promise<boolean>;
  updateDeliveryPacking: (id: string, isPacked: boolean) => Promise<boolean>;
  updateDeliveryStatus: (id: string, status: OperationStatus) => Promise<boolean>;
  validateDelivery: (id: string) => Promise<boolean>;

  // Internal Transfer Operations
  createTransfer: (data: Omit<InternalTransfer, 'id' | 'referenceNumber' | 'status' | 'createdAt'>) => Promise<boolean>;
  updateTransferStatus: (id: string, status: OperationStatus) => Promise<boolean>;
  validateTransfer: (id: string) => Promise<boolean>;

  // Stock Adjustment Operations
  createAdjustment: (
    data: Omit<StockAdjustment, 'id' | 'referenceNumber' | 'differenceQty' | 'status' | 'createdAt'>,
    options?: { validate?: boolean }
  ) => Promise<boolean>;
  validateAdjustment: (id: string) => Promise<boolean>;

  // Warehouse Operations
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => Promise<boolean>;
  addLocationToWarehouse: (
    warehouseId: string,
    location: Omit<Warehouse['locations'][0], 'id' | 'warehouseId'>
  ) => Promise<boolean>;

  // Quick Tools & Guided Tour
  resetToInitialDemo: () => Promise<boolean>;
  getLocationName: (locationId?: string) => string;
  getWarehouseName: (warehouseId?: string) => string;
  triggerQuickReorder: (productId: string) => Promise<boolean>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(() => Boolean(tokenStore.get()));
  const [data, setData] = useState<InventoryState>(EMPTY_STATE);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeView, setActiveViewState] = useState<'landing' | 'app'>('landing');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [landingSummary, setLandingSummary] = useState({ totalUnitsInStock: 0, totalProductsCount: 0, warehousesCount: 0 });
  const noticeId = useRef(0);

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    documentType: 'all',
    status: 'all',
    warehouseId: 'all',
    category: 'all',
    searchQuery: '',
  });

  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    sound.enabled = enabled;
    try {
      localStorage.setItem(SOUND_KEY, JSON.stringify(enabled));
    } catch {
      /* storage unavailable */
    }
  };

  const notify = useCallback((message: string, kind: Notice['kind'] = 'error') => {
    const id = ++noticeId.current;
    setNotices((prev) => [...prev.slice(-2), { id, kind, message }]);
    setTimeout(() => setNotices((prev) => prev.filter((n) => n.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUserState(null);
    setData(EMPTY_STATE);
    setActiveViewState('landing');
  }, []);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        notify('Your session has expired. Please sign in again.');
      } else {
        notify(err instanceof Error ? err.message : 'Something went wrong');
      }
      sound.playError();
    },
    [clearSession, notify]
  );

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return;
    setIsSyncing(true);
    try {
      const state = await api.get<InventoryState>('/api/state');
      setData({ ...state, users: state.users.map(withAvatar) });
    } catch (err) {
      handleError(err);
    } finally {
      setIsSyncing(false);
    }
  }, [handleError]);

  const startSession = useCallback(
    async (token: string, u: UserProfile) => {
      tokenStore.set(token);
      setUserState(withAvatar(u));
      setActiveViewState('app');
      await refresh();
    },
    [refresh]
  );

  // Restore an existing session on page load
  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get<{ user: UserProfile }>('/api/auth/me')
      .then(async ({ user: u }) => {
        setUserState(withAvatar(u));
        setActiveViewState('app');
        await refresh();
      })
      .catch(() => tokenStore.clear())
      .finally(() => setAuthChecking(false));
  }, [refresh]);

  // Public totals for the landing page before anyone signs in
  useEffect(() => {
    if (user) return;
    api
      .get<typeof landingSummary>('/api/public/summary')
      .then(setLandingSummary)
      .catch(() => undefined);
  }, [user]);

  // Keep data fresh for multiple users working at the same time
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user, refresh]);

  /** Runs a mutation, refreshes the snapshot and reports errors. */
  const mutate = useCallback(
    async (fn: () => Promise<unknown>, onSuccess?: () => void): Promise<boolean> => {
      try {
        await fn();
        await refresh();
        onSuccess?.();
        return true;
      } catch (err) {
        handleError(err);
        await refresh();
        return false;
      }
    },
    [refresh, handleError]
  );

  // ---------------- Auth ----------------

  // Auth calls throw on failure so the sign-in form can show the message inline
  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: UserProfile }>('/api/auth/login', { email, password });
    await startSession(res.token, res.user);
  };

  const signup = async (payload: { name: string; email: string; password: string; role: Role }) => {
    const res = await api.post<{ token: string; user: UserProfile }>('/api/auth/signup', payload);
    await startSession(res.token, res.user);
  };

  const logout = () => {
    clearSession();
    sound.playBeep();
  };

  const requestPasswordOtp = (email: string) =>
    api.post<{ devOtp?: string; emailSent: boolean; expiresInSeconds: number }>('/api/auth/forgot-password', { email });

  const verifyPasswordOtp = async (email: string, otp: string) => {
    const res = await api.post<{ resetToken: string }>('/api/auth/verify-otp', { email, otp });
    return res.resetToken;
  };

  const resetPasswordWithToken = async (resetToken: string, password: string) => {
    const res = await api.post<{ token: string; user: UserProfile }>('/api/auth/reset-password', {
      resetToken,
      password,
    });
    await startSession(res.token, res.user);
  };

  const setActiveView = (view: 'landing' | 'app') => {
    // The app itself is only reachable after signing in
    if (view === 'app' && !user) return;
    setActiveViewState(view);
  };

  // ---------------- Users ----------------

  const createStaffAccount = async (payload: {
    name: string;
    email: string;
    role: Role;
    warehouseId: string;
    temporaryPassword?: string;
  }) => {
    try {
      const res = await api.post<{ user: UserProfile; temporaryPassword: string }>('/api/users', payload);
      await refresh();
      sound.playSuccess();
      return { user: withAvatar(res.user), temporaryPassword: res.temporaryPassword };
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  const updateMyProfile = async (updates: {
    name?: string;
    email?: string;
    warehouseId?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    try {
      const res = await api.patch<{ user: UserProfile }>('/api/auth/me', updates);
      setUserState(withAvatar(res.user));
      await refresh();
      sound.playSuccess();
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  const deleteUserAccount = (userId: string) =>
    mutate(() => api.delete(`/api/users/${userId}`), () => sound.playBeep());

  // ---------------- Helpers ----------------

  const { warehouses, products, receipts, deliveries, transfers, adjustments, moveHistory, users } = data;

  const resetFilters = () => {
    setActiveFilters({
      documentType: 'all',
      status: 'all',
      warehouseId: 'all',
      category: 'all',
      searchQuery: '',
    });
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return 'Unknown Location';
    for (const wh of warehouses) {
      const loc = wh.locations.find((l) => l.id === locationId);
      if (loc) return `${wh.name} (${loc.name})`;
    }
    return locationId;
  };

  const getWarehouseName = (warehouseId?: string) => {
    if (!warehouseId || warehouseId === 'all') return 'All Warehouses';
    const wh = warehouses.find((w) => w.id === warehouseId);
    return wh ? wh.name : warehouseId;
  };

  // Dashboard KPIs calculation
  const kpis: DashboardKPIs = useMemo(() => {
    let totalUnits = 0;
    let valuation = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      totalUnits += p.totalStock;
      valuation += p.totalStock * p.price;
      if (p.totalStock <= 0) {
        outOfStock++;
      } else if (p.totalStock <= p.reorderingRule.minQuantity) {
        lowStock++;
      }
    });

    const isOpen = (s: OperationStatus) => s !== 'done' && s !== 'canceled';

    return {
      totalProductsCount: products.length,
      totalUnitsInStock: totalUnits,
      lowStockItemsCount: lowStock,
      outOfStockItemsCount: outOfStock,
      pendingReceiptsCount: receipts.filter((r) => isOpen(r.status)).length,
      pendingDeliveriesCount: deliveries.filter((d) => isOpen(d.status)).length,
      internalTransfersScheduledCount: transfers.filter((t) => isOpen(t.status)).length,
      totalInventoryValuation: valuation,
    };
  }, [products, receipts, deliveries, transfers]);

  // Low stock alerts list
  const lowStockAlerts: LowStockAlert[] = useMemo(() => {
    return products
      .filter((p) => p.totalStock <= p.reorderingRule.minQuantity)
      .map((p) => ({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.totalStock,
        minQuantity: p.reorderingRule.minQuantity,
        recommendedReorder: p.reorderingRule.reorderQuantity,
        unitOfMeasure: p.unitOfMeasure,
      }));
  }, [products]);

  // ---------------- Products ----------------

  const addProduct = (p: NewProduct) =>
    mutate(
      () =>
        api.post('/api/products', {
          name: p.name,
          sku: p.sku,
          category: p.category,
          unitOfMeasure: p.unitOfMeasure,
          price: p.price,
          cost: p.cost,
          description: p.description,
          image: p.image,
          reorderingRule: p.reorderingRule,
          initialLocationStocks: p.initialLocationStocks,
        }),
      () => sound.playSuccess()
    );

  const updateProduct = (id: string, updates: Partial<Product>) =>
    mutate(
      () =>
        api.patch(`/api/products/${id}`, {
          name: updates.name,
          sku: updates.sku,
          category: updates.category,
          unitOfMeasure: updates.unitOfMeasure,
          price: updates.price,
          cost: updates.cost,
          description: updates.description,
          image: updates.image,
          reorderingRule: updates.reorderingRule,
        }),
      () => sound.playBeep()
    );

  const deleteProduct = (id: string) => mutate(() => api.delete(`/api/products/${id}`), () => sound.playBeep());

  // ---------------- Receipts (PDF: validate -> stock increases) ----------------

  const createReceipt = (r: Omit<Receipt, 'id' | 'referenceNumber' | 'status' | 'createdAt'>) =>
    mutate(
      () =>
        api.post('/api/receipts', {
          supplier: r.supplier,
          destLocationId: r.destLocationId,
          scheduledDate: r.scheduledDate,
          notes: r.notes,
          items: r.items.map((i) => ({ productId: i.productId, demandQty: i.demandQty, doneQty: i.doneQty })),
        }),
      () => sound.playBeep()
    );

  const updateReceiptStatus = (id: string, status: OperationStatus) =>
    mutate(() => api.patch(`/api/receipts/${id}`, { status }), () => sound.playBeep());

  const validateReceipt = (id: string) =>
    mutate(() => api.post(`/api/receipts/${id}/validate`), () => sound.playSuccess());

  // ---------------- Deliveries (PDF: pick -> pack -> validate -> stock decreases) ----------------

  const createDelivery = (
    d: Omit<DeliveryOrder, 'id' | 'referenceNumber' | 'status' | 'isPicked' | 'isPacked' | 'createdAt'>
  ) =>
    mutate(
      () =>
        api.post('/api/deliveries', {
          customer: d.customer,
          sourceLocationId: d.sourceLocationId,
          scheduledDate: d.scheduledDate,
          shippingAddress: d.shippingAddress,
          notes: d.notes,
          items: d.items.map((i) => ({ productId: i.productId, demandQty: i.demandQty, doneQty: i.doneQty })),
        }),
      () => sound.playBeep()
    );

  const updateDeliveryPicking = (id: string, isPicked: boolean) =>
    mutate(() => api.patch(`/api/deliveries/${id}`, { isPicked }), () => sound.playScan());

  const updateDeliveryPacking = (id: string, isPacked: boolean) =>
    mutate(() => api.patch(`/api/deliveries/${id}`, { isPacked }), () => sound.playBeep());

  const updateDeliveryStatus = (id: string, status: OperationStatus) =>
    mutate(() => api.patch(`/api/deliveries/${id}`, { status }), () => sound.playBeep());

  const validateDelivery = (id: string) =>
    mutate(() => api.post(`/api/deliveries/${id}/validate`), () => sound.playSuccess());

  // ---------------- Internal transfers (total unchanged, location updated) ----------------

  const createTransfer = (t: Omit<InternalTransfer, 'id' | 'referenceNumber' | 'status' | 'createdAt'>) =>
    mutate(
      () =>
        api.post('/api/transfers', {
          sourceLocationId: t.sourceLocationId,
          destLocationId: t.destLocationId,
          scheduledDate: t.scheduledDate,
          purpose: t.purpose,
          items: t.items.map((i) => ({ productId: i.productId, demandQty: i.demandQty, doneQty: i.doneQty })),
        }),
      () => sound.playBeep()
    );

  const updateTransferStatus = (id: string, status: OperationStatus) =>
    mutate(() => api.patch(`/api/transfers/${id}`, { status }), () => sound.playBeep());

  const validateTransfer = (id: string) =>
    mutate(() => api.post(`/api/transfers/${id}/validate`), () => sound.playSuccess());

  // ---------------- Stock adjustments (recorded vs. physical count) ----------------

  const createAdjustment = (
    a: Omit<StockAdjustment, 'id' | 'referenceNumber' | 'differenceQty' | 'status' | 'createdAt'>,
    options?: { validate?: boolean }
  ) =>
    mutate(
      () =>
        api.post('/api/adjustments', {
          locationId: a.locationId,
          productId: a.productId,
          countedQty: a.countedQty,
          reason: a.reason,
          notes: a.notes,
          validate: options?.validate ?? false,
        }),
      () => (options?.validate ? sound.playSuccess() : sound.playBeep())
    );

  const validateAdjustment = (id: string) =>
    mutate(() => api.post(`/api/adjustments/${id}/validate`), () => sound.playSuccess());

  // ---------------- Warehouses ----------------

  const addWarehouse = (w: Omit<Warehouse, 'id'>) =>
    mutate(
      () =>
        api.post('/api/warehouses', {
          name: w.name,
          code: w.code,
          address: w.address,
          manager: w.manager,
          locations: w.locations.map((l) => ({ name: l.name, code: l.code, type: l.type, capacity: l.capacity })),
        }),
      () => sound.playSuccess()
    );

  const addLocationToWarehouse = (
    warehouseId: string,
    l: Omit<Warehouse['locations'][0], 'id' | 'warehouseId'>
  ) =>
    mutate(
      () => api.post(`/api/warehouses/${warehouseId}/locations`, { name: l.name, code: l.code, type: l.type, capacity: l.capacity }),
      () => sound.playBeep()
    );

  // Quick 1-click reorder from a low stock alert
  const triggerQuickReorder = (productId: string) =>
    mutate(
      () => api.post(`/api/products/${productId}/reorder`),
      () => {
        sound.playSuccess();
        notify('Replenishment receipt created (status: Waiting)', 'success');
      }
    );

  const resetToInitialDemo = () =>
    mutate(
      () => api.post('/api/demo/reset'),
      () => {
        sound.playSuccess();
        notify('Demo inventory restored', 'success');
      }
    );

  const currentUser = user ?? GUEST_USER;
  const publicSummary = user
    ? { totalUnitsInStock: kpis.totalUnitsInStock, totalProductsCount: kpis.totalProductsCount, warehousesCount: warehouses.length }
    : landingSummary;

  return (
    <InventoryContext.Provider
      value={{
        user: currentUser,
        isAuthenticated: Boolean(user),
        authChecking,
        login,
        signup,
        logout,
        requestPasswordOtp,
        verifyPasswordOtp,
        resetPasswordWithToken,
        role: currentUser.role,
        users,
        activeView,
        setActiveView,
        createStaffAccount,
        updateMyProfile,
        deleteUserAccount,
        warehouses,
        products,
        receipts,
        deliveries,
        transfers,
        adjustments,
        moveHistory,
        kpis,
        publicSummary,
        lowStockAlerts,
        soundEnabled,
        setSoundEnabled,
        isSyncing,
        refresh,
        notify,
        activeFilters,
        setActiveFilters,
        resetFilters,
        addProduct,
        updateProduct,
        deleteProduct,
        createReceipt,
        updateReceiptStatus,
        validateReceipt,
        createDelivery,
        updateDeliveryPicking,
        updateDeliveryPacking,
        updateDeliveryStatus,
        validateDelivery,
        createTransfer,
        updateTransferStatus,
        validateTransfer,
        createAdjustment,
        validateAdjustment,
        addWarehouse,
        addLocationToWarehouse,
        resetToInitialDemo,
        getLocationName,
        getWarehouseName,
        triggerQuickReorder,
      }}
    >
      {children}

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm pointer-events-none">
        {notices.map((n) => (
          <div
            key={n.id}
            role={n.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto px-4 py-3 rounded-2xl border shadow-lg text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              n.kind === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
