import React, { createContext, useContext, useState, useEffect } from 'react';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
    mode: PaletteMode;
    toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children, }) => {
    const [mode, setMode] = useState<PaletteMode>(() => {
        if (typeof window !== 'undefined') {
            const storedMode = localStorage.getItem('theme') as PaletteMode | null;
            return storedMode ?? 'dark'; // Default to dark mode
        }
        return 'dark';
    });

    const toggleColorMode = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('theme', newMode);
    };

    useEffect(() => {
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            setMode(e.matches ? "dark" : "light");
        };

        const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        darkModeMediaQuery.addEventListener("change", handleSystemThemeChange);

        return () => {
            darkModeMediaQuery.removeEventListener("change", handleSystemThemeChange);
        };
    }, []);

    return (
        <ThemeContext.Provider value={{ mode, toggleColorMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeContext = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
};
