import P from 'prop-types';
import * as Styled from './styles';

import { Button } from '../../../Button';
import { Input } from '../../Input';
import { useState } from 'react';

import hide from '../../../../assets/hide-password.svg'
import { useContext } from 'react';
import { MyContext } from '../../../Contexts';
import { useNavigate } from 'react-router-dom';

export const Register2 = () => {
  const [equal, setEqual] = useState(true);

  const navigate = useNavigate();
  const goTo = (path) => {
    navigate(path);
  }

  const {
    registerName,
    registerEmail,
  } = useContext(MyContext);

  const submitRegister = (psw) => {
    const data = {
      name: registerName,
      email: registerEmail,
      password: psw,
    }

    try {
      fetch('http://localhost:8000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        }
      ).then(res => res.json())
        .then(goTo('/register/step-3'))
    } catch (error) {
      console.error(error);
    }
  }

  const validatePassword = (e) => {
    e.preventDefault();

    if (e.target[1].value !== e.target[0].value) {
      return setEqual(false);
    } else {
      return submitRegister(e.target[0].value);
    }
  }


  return (
    <Styled.Container onSubmit={validatePassword}>
      <Input label='Senha' ph='Digite sua Senha' required type='password' passwordImg min={8} />
      <Input label='Repita a Senha' ph='Digite sua Senha' required type='password' passwordImg equal={equal} min={8} />
      <Button type='submit'>Entrar</Button>
      <p>Já possui uma conta? Faça o <a href="/">Login</a></p>
    </Styled.Container>
  );
};
