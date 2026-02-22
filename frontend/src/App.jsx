import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Analytics from './pages/Analytics';
import Categories from './pages/Categories';
import Habits from './pages/Habits';
import StandupPage from './pages/Standup';
import IncomePage from './pages/Income';
import SchedulePage from './pages/Schedule';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/standup" element={<StandupPage />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/schedule" element={<SchedulePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
