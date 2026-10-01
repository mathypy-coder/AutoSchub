import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
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
const Dashboard = lazy(() => import('./pages/instructor/Dashboard.jsx'));
const InstructorProfile = lazy(() => import('./pages/instructor/InstructorProfile.jsx'));

const STUDENT_NAV = [
  { to: '/reserver', label: 'Réserver', icon: '🚗' },
  { to: '/lecons', label: 'Mes leçons', icon: '📅' },
  { to: '/theorie', label: 'Théorie', icon: '📝' },
  { to: '/centres', label: 'Centres', icon: '🏁' },
  { to: '/pack', label: 'Mon pack', icon: '🎟️' },
  { to: '/profil', label: 'Profil', icon: '👤' },
];

const INSTRUCTOR_NAV = [
  { to: '/moniteur', label: 'Conduire', icon: '🟢' },
  { to: '/moniteur/lecons', label: 'Leçons', icon: '📅' },
  { to: '/moniteur/centres', label: 'Centres', icon: '🏁' },
  { to: '/moniteur/profil', label: 'Profil', icon: '👤' },
];

function Shell({ nav, children }) {
  return (
    <div className="shell">
      <main className="shell-main">
        <Suspense fallback={<div className="page muted">Chargement…</div>}>{children}</Suspense>
      </main>
      <BottomNav items={nav} />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="splash">AutoSchub</div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
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
        <Route path="/profil" element={<Profile />} />
        <Route path="*" element={<Navigate to="/reserver" replace />} />
      </Routes>
    </Shell>
  );
}
