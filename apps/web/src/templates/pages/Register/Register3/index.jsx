import P from 'prop-types';
import * as Styled from './styles';
import step3 from '../../../../assets/step_3.svg';
import progress3 from '../../../../assets/progress3.svg';

import { RegisterComplete as Page } from '../../../../components/Forms/Register/RegisterComplete';
import { ProgressBar } from '../../../../components/Forms/Register/ProgressBar';

export const Register3 = () => {
  return (
    <Styled.Container>
      <Styled.Left>
        <img src={step3} alt="setp-1" />
        <div className='step-description'>
          <div>
            <h3>Cadastre-se</h3>
            <p>Por favor, escreva seu nome e e-mail</p>
          </div>
          <div>
            <h3>Escolha uma senha</h3>
            <p>Escolha uma senha segura</p>
          </div>
          <div>
            <h3>Cadastro realizado com sucesso</h3>
            <p>E-mail e senha cadastrados com sucesso</p>
          </div>
        </div>
      </Styled.Left>
      <Styled.Right>
        <Page />
        <ProgressBar stg={3} />
      </Styled.Right>
    </Styled.Container>
  );
};
