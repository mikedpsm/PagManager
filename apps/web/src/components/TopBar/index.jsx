import P from 'prop-types';
import { useMemo } from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MyContext } from '../Contexts';
import * as Styled from './styles';
import { User } from './User';

export const TopBar = ({ page = '' }) => {
  const { user, setUser } = useContext(MyContext);

  const pageTitle = (page) => {
    if (page === 'Início') return 'Resumo de Cobranças';
    if (page.includes('>')) {
      const split = page.split(' > ')
      return <span><span style={{ color:'#0E8750'}}>{split[0]}</span>{' > ' + split[1]}</span>;
    }
    return page;
  };

  const navigate = useNavigate();

  useEffect(() => {
    const goTo = (path) => {
      navigate(path);
    };
    const recovered = localStorage.getItem('user');

    if (recovered) {
      return setUser(JSON.parse(recovered));
    }

  }, [setUser, navigate]);

  return (
    <Styled.Container>
      <Styled.PageTitle page={page}>{pageTitle(page)}</Styled.PageTitle>
      <User aka={user.aka}>{user.name}</User>
    </Styled.Container>
  );
};

TopBar.propTypes = {
  page: P.string.isRequired,
};
