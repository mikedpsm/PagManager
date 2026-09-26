import P from 'prop-types';
import * as Styled from './styles';
import step1 from '../../../../assets/step_1.svg';
import progress1 from '../../../../assets/progress1.svg';
import { Register1 as Page } from '../../../../components/Forms/Register/Register1';
import { ProgressBar } from '../../../../components/Forms/Register/ProgressBar'
export const Register1 = () => {
  return (
    <Styled.Container>
      <Styled.Left>
        <img src={step1} alt="setp-1" />
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
        <h1>Adicione seus dados</h1>
        <Page />
        <ProgressBar stg={1} />
      </Styled.Right>
    </Styled.Container>
  );
};
