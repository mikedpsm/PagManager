import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '..';
import { LoginPage } from '../../pages/Login';
import { Register1 } from '../../pages/Register/Register1';
import { Register2 } from '../../pages/Register/Register2';
import { Register3 } from '../../pages/Register/Register3';
import { Private } from '../private_routes';
import { Home } from '../../pages/Home/Home';
import { ClientsPage } from '../../pages/Clients';
import { ChargesPage } from '../../pages/Charges';
import { ClientPage } from '../../pages/Client';

export const MyRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register/step-1" element={<Register1 />} />
        <Route path="/register/step-2" element={<Register2 />} />
        <Route path="/register/step-3" element={<Register3 />} />
        <Route element={<Private />}>
          <Route path="/home" element={<Home />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/client" element={<ClientPage />} />
          <Route path="/charges" element={<ChargesPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};
