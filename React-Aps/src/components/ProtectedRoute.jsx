import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const TEACHER_EMAIL = "anass.khadir@usmba.ac.ma";

function ProtectedRoute({ children, teacherOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="center-msg">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (teacherOnly && user.email !== TEACHER_EMAIL) {
    return <p className="center-msg">Access restricted to the teacher account.</p>;
  }

  return children;
}

export default ProtectedRoute;
