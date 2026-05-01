import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

// 🌸 الألوان الجديدة
export const colors = {
    light: {
        primary: '#3b4e61',     // Rose bebe
        secondary: '#3b4e61',   // Rose clair
        background: '#FFF5F5',  // Blanc rosé
        card: '#FFFFFF',
        text: '#4A4A4A',
        textLight: '#9B9B9B',
        border: '#F0E0E0',
        header: '#3b4e61',      // Rose foncé
        accent: '#3b4e61',      // Rose mauve
        success: '#6D8B74',
        warning: '#232b33',
        error: '#334557',
        notificationBadge: '#2f3e4e',
        tabActive: '#203339',
        tabInactive: '#3b4e61',
    },
    dark: {
        primary: '#6B4E4E',     // Gris rosé
        secondary: '#5A4040',   // Gris foncé rosé
        background: '#2A2424',  // Gris très foncé
        card: '#3D3030',
        text: '#E8D5D5',
        textLight: '#A59090',
        border: '#4A3A3A',
        header: '#4A3636',
        accent: '#8B6B6B',
        success: '#5A7A5A',
        warning: '#8B6B6B',
        error: '#C46A6A',
        notificationBadge: '#C46A6A',
        tabActive: '#8B6B6B',
        tabInactive: '#6B4E4E',
    }
};

interface ThemeContextType {
    theme: ThemeType;
    colors: typeof colors.light;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeType>('light');

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const saved = await AsyncStorage.getItem('app_theme');
                if (saved === 'dark' || saved === 'light') {
                    setTheme(saved);
                }
            } catch (error) {
                console.error("Error loading theme:", error);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        await AsyncStorage.setItem('app_theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, colors: colors[theme], toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};