import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { auth } = useContext(AuthContext);

  if (!auth.token) {
    return <Navigate to="/login" />;
  }

  return children;
}


