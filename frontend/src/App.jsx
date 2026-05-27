// src/App.jsx
import { useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Layouts & Pages
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import { AuthContext } from "./context/AuthContext";
import Appointments from "./pages/Appointments";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import MyDevices from "./pages/MyDevices";
import OrderService from "./components/OrderService";
import AppointmentDetails from "./pages/AppointmentDetails";
import MeetingRoom from "./pages/MeetingRoom";
import LandingPage from "./pages/LandingPage";
import Doctors  from "./pages/Doctors";
import DoctorDetails from "./pages/DoctorDetails"
import BookAppointment from "./pages/BookAppointment";
import Specialist from "./pages/Specialist";
import EarlyDetection from "./pages/EarlyDetection";

const App = () => {
  const { patient } = useContext(AuthContext);
  const { i18n } = useTranslation();

  useEffect(() => {
    const language = i18n.language?.toLowerCase().split(/[-_]/)[0] || "en";
    document.title =
      language === "ru" ? "Панель пациента | СОФОС" : "Patient Portal | SOPHOS";
  }, [i18n.language]);

  return (
    <Routes>
      {/* Auth Routes - no AppLayout */}
      <Route
        path="/"
        element={
          patient ? <Navigate to="/dashboard" replace /> : <LandingPage />
        }
      />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Main app routes with SideNavbar - all guest accessible */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/doctors" element={<Doctors/>}/>
        <Route path="/doctors/:id" element={<DoctorDetails/>}/>
        <Route path="/bookAppointment" element={<BookAppointment />} />
        {/* <Route path="/bookings" element={<Appointments />} /> */}
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/:id" element={<AppointmentDetails />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/devices" element={<MyDevices />} />
        <Route path="/order-service" element={<OrderService />} />
        <Route path="/meeting-room" element={<MeetingRoom />} />
        <Route path="/specialist" element={<Specialist />} />
        <Route path="/early-detection" element={<EarlyDetection />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
