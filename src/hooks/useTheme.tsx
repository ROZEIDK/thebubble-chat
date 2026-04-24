import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { applyTheme, loadTheme, saveTheme, StoredTheme, ThemeVars } from "@/lib/themes";

interface ThemeCtx {
  theme: StoredTheme;
  setPreset: (id: StoredTheme["id"]) => void;
  setCustom: (vars: ThemeVars) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: { id: "midnight" },
  setPreset: () => {},
  setCustom: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<StoredTheme>(() => loadTheme());

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  const setPreset = useCallback((id: StoredTheme["id"]) => {
    setTheme((prev) => ({ id, custom: prev.custom }));
  }, []);

  const setCustom = useCallback((vars: ThemeVars) => {
    setTheme({ id: "custom", custom: vars });
  }, []);

  return <Ctx.Provider value={{ theme, setPreset, setCustom }}>{children}</Ctx.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(Ctx);
