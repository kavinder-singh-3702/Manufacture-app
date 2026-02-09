import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import { getTheme, ResolvedThemeMode, Theme, ThemeMode } from "../theme";
import { themeStorage } from "../services/themeStorage";
import { userService } from "../services/user.service";
import { useAuth } from "../hooks/useAuth";

const DEFAULT_MODE: ThemeMode = "system";

const isThemeMode = (value: unknown): value is ThemeMode => {
  return value === "system" || value === "light" || value === "dark";
};

const resolveThemeMode = (
  mode: ThemeMode,
  colorScheme: "light" | "dark" | null
): ResolvedThemeMode => {
  if (mode === "light" || mode === "dark") return mode;
  return colorScheme === "light" ? "light" : "dark";
};

type ThemeModeContextValue = {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  initialized: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

export const ThemeContext = createContext<Theme>(getTheme("dark"));

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: DEFAULT_MODE,
  resolvedMode: "dark",
  initialized: false,
  setMode: () => {},
  toggleMode: () => {},
});

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const { user } = useAuth();

  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [initialized, setInitialized] = useState(false);
  const [hasLocalPreference, setHasLocalPreference] = useState(false);

  const lastServerSyncModeRef = useRef<ThemeMode | null>(null);

  const resolvedMode = resolveThemeMode(mode, systemColorScheme ?? null);

  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      const storedMode = await themeStorage.getThemeMode();
      if (!isMounted) return;

      if (storedMode) {
        setModeState(storedMode);
        setHasLocalPreference(true);
      }

      setInitialized(true);
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    void themeStorage.setThemeMode(mode);
  }, [initialized, mode]);

  const signedInUser = Boolean(user && user.id !== "guest" && user.role !== "guest");
  const serverThemePreference = isThemeMode(user?.preferences?.theme)
    ? (user?.preferences?.theme as ThemeMode)
    : null;

  // First boot for authenticated users: adopt server theme only if device has no explicit preference.
  useEffect(() => {
    if (!initialized || hasLocalPreference || !signedInUser || !serverThemePreference) {
      return;
    }

    setModeState(serverThemePreference);
    setHasLocalPreference(true);
    lastServerSyncModeRef.current = serverThemePreference;
  }, [hasLocalPreference, initialized, serverThemePreference, signedInUser]);

  // Keep server preference in sync with local preference (best effort, no blocking UI).
  useEffect(() => {
    if (!initialized || !signedInUser) return;

    if (serverThemePreference === mode) {
      lastServerSyncModeRef.current = mode;
      return;
    }

    if (lastServerSyncModeRef.current === mode) {
      return;
    }

    lastServerSyncModeRef.current = mode;
    void userService
      .updateCurrentUser({ preferences: { theme: mode } })
      .catch(() => {
        if (lastServerSyncModeRef.current === mode) {
          lastServerSyncModeRef.current = null;
        }
      });
  }, [initialized, mode, serverThemePreference, signedInUser]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState((currentMode) => {
      if (currentMode === nextMode) return currentMode;
      return nextMode;
    });
    setHasLocalPreference(true);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(resolvedMode === "dark" ? "light" : "dark");
  }, [resolvedMode, setMode]);

  // Ensure system mode reacts to runtime appearance updates across native/web.
  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      // useColorScheme() already updates on change; no-op listener keeps compatibility for older runtimes.
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const theme = useMemo(() => getTheme(resolvedMode), [resolvedMode]);

  const modeValue = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      resolvedMode,
      initialized,
      setMode,
      toggleMode,
    }),
    [initialized, mode, resolvedMode, setMode, toggleMode]
  );

  return (
    <ThemeModeContext.Provider value={modeValue}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ThemeModeContext.Provider>
  );
};
