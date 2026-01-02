
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Students from './pages/Students';
import Grades from './pages/Grades';
import Diploma from './pages/Diploma';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="students" element={<Students />} />
          <Route path="grades" element={<Grades />} />
          <Route path="diploma" element={<Diploma />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
