import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { initScrollAnimations } from "./hooks/useScrollAnimation.js";
import { useTheme } from "./hooks/useTheme.js";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

const Login = lazy(() => import("./components/Login.jsx"));
const Signup = lazy(() => import("./components/Signup.jsx"));
const Quiz = lazy(() => import("./components/Quiz.jsx"));
const Dashboard = lazy(() => import("./components/Dashboard.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const StudentProfile = lazy(() => import("./pages/StudentProfile.jsx"));
const Management = lazy(() => import("./pages/Management.jsx"));
const QcmEditor = lazy(() => import("./pages/QcmEditor.jsx"));
const ResultDetail = lazy(() => import("./pages/ResultDetail.jsx"));
const Courses = lazy(() => import("./pages/Courses.jsx"));
const Passerelle = lazy(() => import("./pages/Passerelle.jsx"));

function PageLoader() {
  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        <p style={{ marginTop: 14, color: "var(--text-muted)", fontSize: "0.88rem" }}>Chargement...</p>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  useTheme(); // Initialise et persiste le thème (data-theme sur <html>)

  // Scroll to top and re-trigger animations on page change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const cleanup = initScrollAnimations();
    return cleanup;
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cours"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cpge"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passerelle"
            element={
              <ProtectedRoute>
                <Passerelle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:examId"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/:studentId"
            element={
              <ProtectedRoute>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result/:resultId"
            element={
              <ProtectedRoute>
                <ResultDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute teacherOnly>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/management"
            element={
              <ProtectedRoute teacherOnly>
                <Management />
              </ProtectedRoute>
            }
          />
          <Route
            path="/management/qcm/:examId"
            element={
              <ProtectedRoute teacherOnly>
                <QcmEditor />
              </ProtectedRoute>
            }
          />
          {/* Catch-all route to avoid blank screen on unmatched URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
