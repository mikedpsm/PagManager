import { useContext } from 'react';
import { MyContext } from '../../components/Contexts';
import { useNavigate, Outlet } from 'react-router-dom';
import { Loading } from '../../components/Loading';

export const Private = () => {
  const { authenticated, setUser } = useContext(MyContext);
  const navigate = useNavigate();

  if (!authenticated) {
    setUser('')
    return navigate('/');
  }

  return <Outlet />
}
