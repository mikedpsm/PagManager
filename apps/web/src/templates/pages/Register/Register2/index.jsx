import P from 'prop-types';
import * as Styled from './styles';
import step2 from '../../../../assets/step_2.svg';
import progress2 from '../../../../assets/progress2.svg';

import { Register2 as Page } from '../../../../components/Forms/Register/Register2';
import { ProgressBar } from '../../../../components/Forms/Register/ProgressBar';


export const Register2 = () => {
  return (
    <Styled.Container>
      <Styled.Left>
        <img src={step2} alt="setp-1" />
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
        <h1>Escolha uma senha</h1>
        <Page />
        <ProgressBar stg={2} />
      </Styled.Right>
    </Styled.Container>
  );
};
