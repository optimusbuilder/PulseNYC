import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import MainView from './components/MainView';
import SharedReport from './components/SharedReport';
import './App.css';

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/r/:reportId" element={<SharedReport />} />
      </Routes>
    </AppProvider>
  );
}
