import { createContext, ReactNode } from "react";
import { theme, Theme } from "../theme";

export const ThemeContext = createContext<Theme>(theme);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};
