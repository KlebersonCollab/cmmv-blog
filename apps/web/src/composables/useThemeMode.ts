import { ref, onMounted, watch } from 'vue';

const isDarkMode = ref(false);

/**
 * Composable para gerenciar o tema claro/escuro da aplicação.
 * Ele sincroniza com o localStorage e as preferências do sistema.
 */
export function useThemeMode() {

  const applyTheme = () => {
    if (typeof document !== 'undefined') {
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
    }
    applyTheme();
  };

  const initializeTheme = () => {
    if (typeof window === 'undefined') {
      return;
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      isDarkMode.value = savedTheme === 'dark';
    } else {
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
  };

  const setupSystemThemeListener = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          isDarkMode.value = e.matches;
          applyTheme();
        }
      });
    }
  };

  onMounted(() => {
    initializeTheme();
    setupSystemThemeListener();
  });

  watch(isDarkMode, applyTheme);

  return {
    isDarkMode,
    toggleTheme,
    initializeTheme
  };
} 