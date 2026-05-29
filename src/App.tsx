import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { ResultPage } from './pages/ResultPage';
import { TrackingPage } from './pages/TrackingPage';
import { ScalesPage } from './pages/ScalesPage';
import { useChatbotStore } from './chatbot/store/useChatbotStore';
import { useAgentStore } from './chatbot/store/useAgentStore';

function App() {
  const patientId = useChatbotStore((s) => s.patientId);

  // On mount, sync patient identity from agent store to chatbot store
  // This ensures the route guard works after page refresh (persist rehydration)
  useEffect(() => {
    const agentState = useAgentStore.getState();
    if (agentState.patientId && !patientId) {
      useChatbotStore.getState().setPatient(agentState.patientId, agentState.patientName);
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
        <Route path="/result" element={<ResultPage />} />
        <Route
          path="/tracking"
          element={patientId ? <TrackingPage /> : <Navigate to="/" />}
        />
        <Route
          path="/scales"
          element={patientId ? <ScalesPage /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
