"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface SessionUser {
  id: string;
  phone: string;
  role: string;
  membershipStatus: string;
  displayName: string | null;
  province: string | null;
  city: string | null;
  workYears: string | null;
  bio: string | null;
  visibility: string;
  onboardingCompleted: boolean;
  skills: string[];
  interests: string[];
  createdAt: string;
}

interface SessionContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: SessionUser | null;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const previousInitialUser = useRef(initialUser);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const body = (await res.json()) as { data: { user: SessionUser } };
        setUser(body.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (previousInitialUser.current !== initialUser) {
      previousInitialUser.current = initialUser;
      setUser(initialUser);
    }
  }, [initialUser]);

  useEffect(() => {
    if (initialUser === null && previousInitialUser.current === null) {
      refresh();
    }
  }, [initialUser, refresh]);

  const value = useMemo(
    () => ({ user, isLoading, refresh, setUser }),
    [user, isLoading, refresh],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a <SessionProvider>");
  }
  return context;
}
