import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { initScrollAnimations } from "./hooks/useScrollAnimation.js";
import { useTheme } from "./hooks/useTheme.js";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary, { triggerSafeChunkReload } from "./components/ErrorBoundary.jsx";
import Home from "./pages/Home.jsx";

function lazyWithRetry(importer) {
  return lazy(() =>
    importer().catch((err) => {
      if (triggerSafeChunkReload()) {
        return new Promise(() => {});
      }
      throw err;
    })
  );
}

const Login = lazyWithRetry(() => import("./components/Login.jsx"));
const Signup = lazyWithRetry(() => import("./components/Signup.jsx"));
const Quiz = lazyWithRetry(() => import("./components/Quiz.jsx"));
const Dashboard = lazyWithRetry(() => import("./components/Dashboard.jsx"));
const StudentProfile = lazyWithRetry(() => import("./pages/StudentProfile.jsx"));
const Management = lazyWithRetry(() => import("./pages/Management.jsx"));
const QcmEditor = lazyWithRetry(() => import("./pages/QcmEditor.jsx"));
const ResultDetail = lazyWithRetry(() => import("./pages/ResultDetail.jsx"));
const Courses = lazyWithRetry(() => import("./pages/Courses.jsx"));
const Passerelle = lazyWithRetry(() => import("./pages/Passerelle.jsx"));
const PasserelleBac = lazyWithRetry(() => import("./pages/PasserelleBac.jsx"));
const ConcoursCpge = lazyWithRetry(() => import("./pages/ConcoursCpge.jsx"));

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
      <ErrorBoundary resetKey={location.pathname + location.search}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {/* Public Catalog Routes (No login required) */}
            <Route path="/" element={<Home />} />
            <Route path="/cours" element={<Courses />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/cpge" element={<Courses />} />
            <Route path="/passerelle" element={<Passerelle />} />
            <Route path="/passerelle-bac-prepa" element={<PasserelleBac />} />
            <Route path="/passerelle-bac" element={<PasserelleBac />} />
            <Route path="/concours-cpge" element={<ConcoursCpge />} />
            <Route path="/concours" element={<ConcoursCpge />} />
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
    </ErrorBoundary>
  );
}

export default App;
