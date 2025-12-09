import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Officials from './pages/Officials';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDetails from './components/admin/AdminUserDetails';
import NewsPage from './pages/NewsPage';
import Programs from './pages/Programs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/officials" element={<Officials />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users/:id" element={<AdminUserDetails />} />
          <Route path="/programs" element={<Programs />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
