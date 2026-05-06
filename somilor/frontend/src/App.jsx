import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import VehiculosPage from './pages/VehiculosPage'
import ChoferesPage from './pages/ChoferesPage'
import CombustiblePage from './pages/CombustiblePage'
import MantenimientoPage from './pages/MantenimientoPage'
import ChecklistPage from './pages/ChecklistPage'
import AsignacionesPage from './pages/AsignacionesPage' 
import PersonalPage    from './pages/PersonalPage'
import GeneracionPage  from './pages/GeneracionPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#C8A84B', fontFamily:'Space Mono' }}>
      Cargando SOMILOR...
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"      element={<DashboardPage />} />
        <Route path="asignaciones"   element={<AsignacionesPage />} />
        <Route path="vehiculos"      element={<VehiculosPage />} />
        <Route path="choferes"       element={<ChoferesPage />} />
        <Route path="combustible"    element={<CombustiblePage />} />
        <Route path="mantenimiento"  element={<MantenimientoPage />} />
        <Route path="checklist"      element={<ChecklistPage />} />
        <Route path="personal"       element={<PersonalPage />} />
        <Route path="generacion"     element={<GeneracionPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}