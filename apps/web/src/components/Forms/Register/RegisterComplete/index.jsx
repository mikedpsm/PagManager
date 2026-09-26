import P from 'prop-types';
import * as Styled from './styles';
import complete from '../../../../assets/register_complete.svg';
import { Button } from '../../../Button';
import { useNavigate } from 'react-router-dom';

export const RegisterComplete = () => {
  const navigate = useNavigate();
  const goTo = (path) => {
    navigate(path);
  };

  return (
    <Styled.Container>
      <Styled.Success>
        <img src={complete} alt='register complete' />
        <p>Cadastro realizado com sucesso!</p>
      </Styled.Success>
      <Button type='button' onClick={() => goTo('/')}>
        Ir para Login
      </Button>
    </Styled.Container>
  );
};

RegisterComplete.propTypes = {
  children: P.node.isRequired,
};
