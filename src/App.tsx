import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import EasterEggs from './components/EasterEggs';
import Home from './pages/Home';
import Members from './pages/Members';
import Events from './pages/Events';
import Finance from './pages/Finance';
import Feedback from './pages/Feedback';
import Flag from './pages/Flag';
import NotFound from './pages/NotFound';
import './assets/style.css'; // Global styles

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/members" element={<Members />} />
        <Route path="/events" element={<Events />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/flag" element={<Flag />} />
        <Route path="/terminal" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <EasterEggs />
    </Router>
  );
}

export default App;
