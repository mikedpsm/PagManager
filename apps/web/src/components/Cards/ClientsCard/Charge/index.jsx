import P from 'prop-types';
import * as Styled from './styles';

export const Charge = ({ object }) => {
  return (
    <Styled.Container>
      <Styled.Info>{object.name}</Styled.Info>
      <Styled.Info>{object.id}</Styled.Info>
      <Styled.Info>{object.cpf}</Styled.Info>
    </Styled.Container>
  );
};

Charge.propTypes = {
  object: P.object.isRequired,
};
