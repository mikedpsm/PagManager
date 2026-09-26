import P from 'prop-types';
import { useState } from 'react';
import * as Styled from './styles';

import hide_password from '../../../assets/hide-password.svg';
import show_password from '../../../assets/show-password.svg';
import { useEffect } from 'react';


export const Input = ({
    label = '',
    required = false,
    autoComplete,
    min,
    max,
    ph,
    fgtPassword = false,
    type = 'text',
    passwordImg = false,
    equal = true
  }) => {
  const [show, setShow] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [inputValue, setInputValue] = useState('');


  const showPassword = () => {
    if (show) return show_password;
    return hide_password;
  }

  const typeSetter = (tp) => {
    if (passwordImg && show) return 'text';
    if (passwordImg && !show) return 'password';

    return tp;
  }

  useEffect(() => {
    if (autoComplete) {
      setInputValue(autoComplete);
    }
  }, [autoComplete]);

  return (
    <Styled.Label equal={equal}>
      <div>
        <span>{label}{required && '*'}</span>
        {fgtPassword && <a>Esqueceu a Senha?</a>}
      </div>
      <div className='input'>
        <Styled.Container
          placeholder={ph}
          required={required}
          type={typeSetter(type)}
          value={inputValue}
          minLength={min}
          onChange={e => setInputValue(e.target.value)}
          maxLength={max}
        />
        {passwordImg && <img src={showPassword()} onClick={() => setShow(!show)} />}
      </div>
    </Styled.Label>
  );
};

Input.propTypes = {
  label: P.string.isRequired,
  type: P.string.isRequired,
  required: P.bool,
  ph: P.string.isRequired,
  autoComplete: P.string,
  fgtPassword: P.bool,
  passwordImg: P.bool,
  equal: P.bool,
  min: P.number,
  max: P.number,
};
