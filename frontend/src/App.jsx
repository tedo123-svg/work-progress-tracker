import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './pages/Login';
import MainBranchDashboard from './pages/MainBranchDashboard';
import BranchUserDashboard from './pages/BranchUserDashboard';
import AdminDashboard from './pages/AdminDashboard';

import CreateAmharicPlan from './pages/CreateAmharicPlan';
import EditAmharicPlan from './pages/EditAmharicPlan';
import ManageAmharicPlans from './pages/ManageAmharicPlans';
import AmharicPlanReports from './pages/AmharicPlanReports';
import SubmitAmharicReport from './pages/SubmitAmharicReport';
import ViewAmharicReports from './pages/ViewAmharicReports';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to check if user can access main branch features
  const canAccessMainBranchFeatures = (user) => {
    return user?.role === 'main_branch' || 
           user?.role === 'organization_sector' || 
           user?.role === 'information_sector' || 
           user?.role === 'operation_sector' || 
           user?.role === 'peace_value_sector';
  };

  // Helper function to check if user is a woreda sector user
  const isWoredaSectorUser = (user) => {
    return user?.role === 'woreda_organization' ||
           user?.role === 'woreda_information' ||
           user?.role === 'woreda_operation' ||
           user?.role === 'woreda_peace_value';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <LanguageProvider>
      <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/" 
          element={
            user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : canAccessMainBranchFeatures(user) ? (
                <MainBranchDashboard user={user} onLogout={handleLogout} />
              ) : (
                <BranchUserDashboard user={user} onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/admin" 
          element={user?.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        

        
        <Route 
          path="/create-amharic-plan" 
          element={canAccessMainBranchFeatures(user) ? 
                   <CreateAmharicPlan user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/edit-amharic-plan/:id" 
          element={canAccessMainBranchFeatures(user) ? 
                   <EditAmharicPlan user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/manage-amharic-plans" 
          element={canAccessMainBranchFeatures(user) ? 
                   <ManageAmharicPlans user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/amharic-plan-reports" 
          element={user?.role === 'branch_user' || isWoredaSectorUser(user) ? <AmharicPlanReports user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/submit-amharic-report/:planId" 
          element={user?.role === 'branch_user' || isWoredaSectorUser(user) ? <SubmitAmharicReport user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/view-amharic-reports" 
          element={canAccessMainBranchFeatures(user) ? 
                   <ViewAmharicReports user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
