import P from 'prop-types';
import { Button } from '../../../Button';
import { Input } from '../../Input';
import * as Styled from './styles';
import { MyContext } from '../../../Contexts';
import { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const Register1 = () => {
  const {
    setRegisterName,
    setRegisterEmail,
  } = useContext(MyContext);
  const navigate = useNavigate();

  const goTo = (path) => {
    navigate(path);
  }

  const registerValues = (e) => {
    e.preventDefault();
    setRegisterName(e.target[0].value);
    setRegisterEmail(e.target[1].value);
    goTo('/register/step-2');
  }

  return (
    <Styled.Container onSubmit={registerValues}>
      <Input
        label='Nome'
        ph='Digite seu Nome'
        required
        type='text'
      />
      <Input label='E-mail' ph='Digite seu E-mail' required type='email' />
      <Button type='submit'>Entrar</Button>
      <p>Já possui uma conta? Faça o <a href='/'>Login</a></p>
    </Styled.Container>
  );
};
