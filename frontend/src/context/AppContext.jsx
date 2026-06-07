import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

const initialState = {
  reports: [],
  pulseScores: {},
  selectedLocation: null,
  showReportPanel: false,
  selectedReport: null,
  brief: null,
  loading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_REPORTS':
      return { ...state, reports: action.payload };
    case 'ADD_REPORT':
      return { ...state, reports: [...state.reports, action.payload] };
    case 'SET_PULSE_SCORES':
      return { ...state, pulseScores: action.payload };
    case 'SELECT_LOCATION':
      return { ...state, selectedLocation: action.payload, showReportPanel: true };
    case 'CLOSE_REPORT_PANEL':
      return { ...state, showReportPanel: false, selectedLocation: null };
    case 'SELECT_REPORT':
      return { ...state, selectedReport: action.payload };
    case 'CLOSE_REPORT_DETAIL':
      return { ...state, selectedReport: null };
    case 'SET_BRIEF':
      return { ...state, brief: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
