// src/hooks/useTheme.ts
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import type {ThemeContextType} from '../context/ThemeContext';
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用');
  }
  return context;
}