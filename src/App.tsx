import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { ResultPage } from './pages/ResultPage';
import { useChatbotStore } from './chatbot/store/useChatbotStore';

function App() {
  const patientId = useChatbotStore((s) => s.patientId);

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
