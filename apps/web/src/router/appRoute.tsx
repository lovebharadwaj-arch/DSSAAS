import { Route, Routes } from "react-router-dom";

import Login from "../auth/Login";
import Signup from "../auth/Signup";
import DataPages from "../Pages/DataPages";
import Home from "../Pages/Home";
import DSSAASLayout from "./DSAASLayout";
import ProtectedRoute from "./protectedRoute";

export default function AppRoute() {
  return (
    <Routes>
      {/* Public pages: no dashboard sidebar */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Authentication check */}
      <Route element={<ProtectedRoute />}>
        {/* Shared dashboard layout */}
        <Route element={<DSSAASLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/dataPages" element={<DataPages />} />
        </Route>
      </Route>
    </Routes>
  );
}
