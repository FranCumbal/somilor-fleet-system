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
import KilometrajePage from './pages/KilometrajePage'

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#C8A84B', fontFamily:'Space Mono' }}>
      Cargando SOMILOR...
    </div>
  )
  
  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={<DashboardPage />} />
        
        <Route path="asignaciones" element={<PrivateRoute allowedRoles={['admin', 'operador']}><AsignacionesPage /></PrivateRoute>} />
        <Route path="vehiculos" element={<PrivateRoute allowedRoles={['admin', 'operador']}><VehiculosPage /></PrivateRoute>} />
        <Route path="choferes" element={<PrivateRoute allowedRoles={['admin', 'operador']}><ChoferesPage /></PrivateRoute>} />
        <Route path="combustible" element={<PrivateRoute allowedRoles={['admin', 'operador']}><CombustiblePage /></PrivateRoute>} />
        <Route path="checklist" element={<PrivateRoute allowedRoles={['admin', 'operador']}><ChecklistPage /></PrivateRoute>} />
        <Route path="personal" element={<PrivateRoute allowedRoles={['admin', 'operador']}><PersonalPage /></PrivateRoute>} />
        <Route path="generacion" element={<PrivateRoute allowedRoles={['admin', 'operador']}><GeneracionPage /></PrivateRoute>} />
        <Route path="mantenimiento" element={<PrivateRoute allowedRoles={['admin', 'operador', 'transportista']}><MantenimientoPage /></PrivateRoute>} />
        <Route path="kilometraje" element={<PrivateRoute allowedRoles={['admin', 'transportista']}><KilometrajePage /></PrivateRoute>} />
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