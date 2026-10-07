import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { useT } from './i18n.jsx';
import BottomNav from './components/BottomNav.jsx';
import Welcome from './pages/Welcome.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Écrans chargés à la demande : l'accueil et la connexion s'affichent sans
// télécharger la carte (Leaflet) ni le reste de l'application.
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Book = lazy(() => import('./pages/student/Book.jsx'));
const Lessons = lazy(() => import('./pages/Lessons.jsx'));
const Theory = lazy(() => import('./pages/student/Theory.jsx'));
const Pack = lazy(() => import('./pages/student/Pack.jsx'));
const ExamCenters = lazy(() => import('./pages/ExamCenters.jsx'));
const FreeTrack = lazy(() => import('./pages/student/FreeTrack.jsx'));
const Coach = lazy(() => import('./pages/student/Coach.jsx'));
const Dashboard = lazy(() => import('./pages/instructor/Dashboard.jsx'));
const InstructorProfile = lazy(() => import('./pages/instructor/InstructorProfile.jsx'));

const STUDENT_NAV = [
  { to: '/reserver', label: 'common.nav_book', icon: '🚗' },
  { to: '/lecons', label: 'common.nav_lessons', icon: '📅' },
  { to: '/theorie', label: 'common.nav_theory', icon: '📝' },
  { to: '/centres', label: 'common.nav_centers', icon: '🏁' },
  { to: '/pack', label: 'common.nav_pack', icon: '🎟️' },
  { to: '/profil', label: 'common.nav_profile', icon: '👤' },
];

const INSTRUCTOR_NAV = [
  { to: '/moniteur', label: 'common.nav_drive', icon: '🟢' },
  { to: '/moniteur/lecons', label: 'common.nav_instructorLessons', icon: '📅' },
  { to: '/moniteur/centres', label: 'common.nav_centers', icon: '🏁' },
  { to: '/moniteur/profil', label: 'common.nav_profile', icon: '👤' },
];

function Shell({ nav, children }) {
  const t = useT();
  return (
    <div className="shell">
      <main className="shell-main">
        <Suspense fallback={<div className="page muted">{t('common.loading')}</div>}>{children}</Suspense>
      </main>
      <BottomNav items={nav.map((item) => ({ ...item, label: t(item.label) }))} />
    </div>
  );
}

export default function App() {
  const { user, loading, notice } = useAuth();

  if (loading) return <div className="splash">AutoSchub</div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />
        <Route path="*" element={<Navigate to={notice ? '/connexion' : '/'} replace />} />
      </Routes>
    );
  }

  if (user.role === 'instructor') {
    return (
      <Shell nav={INSTRUCTOR_NAV}>
        <Routes>
          <Route path="/moniteur" element={<Dashboard />} />
          <Route path="/moniteur/lecons" element={<Lessons />} />
          <Route path="/moniteur/profil" element={<InstructorProfile />} />
          <Route path="/moniteur/centres" element={<ExamCenters />} />
          <Route path="*" element={<Navigate to="/moniteur" replace />} />
        </Routes>
      </Shell>
    );
  }

  return (
    <Shell nav={STUDENT_NAV}>
      <Routes>
        <Route path="/reserver" element={<Book />} />
        <Route path="/lecons" element={<Lessons />} />
        <Route path="/theorie" element={<Theory />} />
        <Route path="/pack" element={<Pack />} />
        <Route path="/centres" element={<ExamCenters />} />
        <Route path="/libre" element={<FreeTrack />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="*" element={<Navigate to="/reserver" replace />} />
      </Routes>
    </Shell>
  );
}
