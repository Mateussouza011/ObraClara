import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MapPage } from '@pages/MapPage';
import DenunciasPage from '@pages/DenunciasPage';
import './App.css';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/denuncias" element={<DenunciasPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
