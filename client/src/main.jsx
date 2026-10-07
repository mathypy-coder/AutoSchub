import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import App from './App.jsx';
import { AuthProvider } from './auth.jsx';
import { I18nProvider, useI18n } from './i18n.jsx';

// Changer de langue remonte l'application : écrans et données serveur sont rechargés dans la nouvelle langue.
function LocalizedApp() {
  const { lang } = useI18n();
  return <App key={lang} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <LocalizedApp />
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
);
