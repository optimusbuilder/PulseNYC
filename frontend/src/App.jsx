import { AppProvider } from './context/AppContext';
import Map from './components/Map';
import Header from './components/Header';
import ReportPanel from './components/ReportPanel';
import ReportDetail from './components/ReportDetail';
import BriefPanel from './components/BriefPanel';
import './App.css';

export default function App() {
  return (
    <AppProvider>
      <div className="app">
        <Header />
        <Map />
        <ReportPanel />
        <ReportDetail />
        <BriefPanel />
      </div>
    </AppProvider>
  );
}
