import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RoleRoute from './components/RoleRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Students from './pages/Students';
import Grades from './pages/Grades';
import Diploma from './pages/Diploma';
import PreviewSPMB from './pages/PreviewSPMB';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RoleRoute allowedRoles={['admin', 'guru', 'guru_kelas']} />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Home />} />
              <Route path="students" element={<Students />} />
              <Route path="grades" element={<Grades />} />
              <Route path="diploma" element={<Diploma />} />
              <Route path="spmb" element={<PreviewSPMB />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
