import P from 'prop-types';
import * as Styled from './styles';
import arrows from '../../../assets/arrows.svg';

export const ClientTitles = () => {
  return (
    <Styled.Container>
        <th>
          <img src={arrows} alt="arrows" />
          Cliente
        </th>
        <th>
          CPF
        </th>
        <th>
          E-mail
        </th>
        <th>
          Telefone
        </th>
        <th>
          Status
        </th>
        <th>
          Criar Cobrança
        </th>
    </Styled.Container>
  );
};
