import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { AppShell } from "./components/layout/AppShell";
import Login from "./pages/Login";
import OAuthCallback from "./pages/OAuthCallback";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import WeeklySchedule from "./pages/WeeklySchedule";
import Meetings from "./pages/Meetings";
import Tasks from "./pages/Tasks";
import DailyActivities from "./pages/DailyActivities";
import Kaizen from "./pages/Kaizen";
import KaizenDetail from "./pages/KaizenDetail";
import Scoring from "./pages/Scoring";
import Diet from "./pages/Diet";
import OtherTasks from "./pages/OtherTasks";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="weekly" element={<WeeklySchedule />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="daily" element={<DailyActivities />} />
            <Route path="kaizen" element={<Kaizen />} />
            <Route path="kaizen/:id" element={<KaizenDetail />} />
            <Route path="scoring" element={<Scoring />} />
            <Route path="diet" element={<Diet />} />
            <Route path="other" element={<OtherTasks />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
