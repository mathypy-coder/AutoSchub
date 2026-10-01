import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import BottomNav from './components/BottomNav.jsx';
import Welcome from './pages/Welcome.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Book from './pages/student/Book.jsx';
import Lessons from './pages/Lessons.jsx';
import Theory from './pages/student/Theory.jsx';
import Dashboard from './pages/instructor/Dashboard.jsx';
import InstructorProfile from './pages/instructor/InstructorProfile.jsx';

const STUDENT_NAV = [
  { to: '/reserver', label: 'Réserver', icon: '🚗' },
  { to: '/lecons', label: 'Mes leçons', icon: '📅' },
  { to: '/theorie', label: 'Théorie', icon: '📝' },
  { to: '/profil', label: 'Profil', icon: '👤' },
];

const INSTRUCTOR_NAV = [
  { to: '/moniteur', label: 'Conduire', icon: '🟢' },
  { to: '/moniteur/lecons', label: 'Leçons', icon: '📅' },
  { to: '/moniteur/profil', label: 'Profil', icon: '👤' },
];

function Shell({ nav, children }) {
  return (
    <div className="shell">
      <main className="shell-main">{children}</main>
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
        <Route path="/profil" element={<Profile />} />
        <Route path="*" element={<Navigate to="/reserver" replace />} />
      </Routes>
    </Shell>
  );
}
