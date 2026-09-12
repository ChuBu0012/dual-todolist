import { useAuthStore } from './store/authStore';
import { LoginScreen } from './components/auth/LoginScreen';
import { MainLayout } from './components/layout/MainLayout';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return isAuthenticated ? <MainLayout /> : <LoginScreen />;
}
