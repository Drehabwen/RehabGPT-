import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { ResultPage } from './pages/ResultPage';
import { TrackingPage } from './pages/TrackingPage';
import { ScalesPage } from './pages/ScalesPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { AssessmentPage } from './pages/assessment/AssessmentPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { DataCenterPage } from './pages/data-center/DataCenterPage';
import { useChatbotStore } from './chatbot/store/useChatbotStore';
import { useAgentStore } from './chatbot/store/useAgentStore';

function App() {
  const patientId = useChatbotStore((s) => s.patientId);

  // On mount, sync patient identity from agent store to chatbot store
  // This ensures the route guard works after page refresh (persist rehydration)
  useEffect(() => {
    const agentState = useAgentStore.getState();
    if (agentState.patientId && !patientId) {
      useChatbotStore.getState().setPatient(agentState.patientId, agentState.patientName, {
        age: agentState.patientAge,
        sex: agentState.patientSex,
        sessionId: agentState.patientSessionId,
      });
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/chat"
          element={patientId ? <ChatPage /> : <Navigate to="/" />}
        />
        <Route
          path="/prescriptions"
          element={patientId ? <PrescriptionsPage /> : <Navigate to="/" />}
        />
        <Route
          path="/result"
          element={patientId ? <ResultPage /> : <Navigate to="/" />}
        />
        <Route
          path="/tracking"
          element={patientId ? <TrackingPage /> : <Navigate to="/" />}
        />
        <Route
          path="/scales"
          element={patientId ? <ScalesPage /> : <Navigate to="/" />}
        />
        {/* 康复工作台路由 */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/data-center" element={<DataCenterPage />} />
        {/* 404 catch-all */}
        <Route path="*" element={<Navigate to={patientId ? '/chat' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
