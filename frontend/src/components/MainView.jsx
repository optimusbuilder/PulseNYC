import Map from './Map';
import Header from './Header';
import ReportPanel from './ReportPanel';
import ReportDetail from './ReportDetail';
import BriefPanel from './BriefPanel';

export default function MainView() {
  return (
    <div className="app">
      <Header />
      <Map />
      <ReportPanel />
      <ReportDetail />
      <BriefPanel />
    </div>
  );
}
