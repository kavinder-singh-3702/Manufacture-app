import { useContext } from "react";
import { ThemeModeContext } from "../providers/ThemeProvider";

export const useThemeMode = () => useContext(ThemeModeContext);
