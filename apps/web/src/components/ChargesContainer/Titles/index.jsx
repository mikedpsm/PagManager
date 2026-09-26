import P from 'prop-types';
import * as Styled from './styles';
import arrows from '../../../assets/arrows.svg';
import { useLocation } from 'react-router-dom';

export const ChargesTitles = () => {
  const location = useLocation();
  return (
    <Styled.Container>
      <div>
        {location.pathname == '/charges' && (<span>
          <img src={arrows} alt="arrows" />
          Cliente
        </span>)}
        <span>
          <img src={arrows} alt="arrows" />
          ID Cob.
        </span>
        <span>
          Valor
        </span>
        <span>
          Data de venc.
        </span>
        <span>
          Status
        </span>
        <span>
          Descrição
        </span>
      </div>
    </Styled.Container>
  );
};
