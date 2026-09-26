import P from 'prop-types';
import * as Styled from './styles';
import { Input } from '../Input';
import { Button } from '../../Button';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { MyContext } from '../../Contexts/index'

export const LoginForm = () => {

  const { setUser, setFeedbackMessage,
    setFeedbackType,
    setFeedbackActive } = useContext(MyContext);

  const navigate = useNavigate();
  const goTo = (path) => {
    navigate(path);
  };

  const loginSubmit = async (e) => {
    e.preventDefault();

    const data = {
      email: e.target[0].value,
      password: e.target[1].value
    }

    try {
      const req = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
      });

      const res = await req.json();

      if (req.status !== 200) throw new Error(res.error);

      localStorage.setItem('token', res.token);

      const logged = res.user;

      localStorage.setItem('user', JSON.stringify(logged));

      setUser(logged);
      goTo('/home');

    } catch (error) {
      setFeedbackMessage(error.message),
      setFeedbackType('fail'),
      setFeedbackActive(true)
    }
  }

  return (
    <Styled.Container onSubmit={loginSubmit}>
      <Input label='E-mail' ph='Digite seu E-mail' type='email' required />
      <Input label='Senha' ph='Digite sua Senha' type='password' fgtPassword={true} required passwordImg />
      <Button type='submit'>Entrar</Button>
      <p>Ainda não possui uma conta? <a href="/register/step-1">Cadastre-se</a></p>
    </Styled.Container>
  );
};
