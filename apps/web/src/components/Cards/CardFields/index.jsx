import P from 'prop-types';
import * as Styled from './styles';

export const CardFields = ({ middle, end }) => {
  return (
    <Styled.Container>
      <Styled.Field>Cliente</Styled.Field>
      <Styled.Field>{middle}</Styled.Field>
      <Styled.Field className='value_field'>{end}</Styled.Field>
    </Styled.Container>
  );
};

CardFields.propTypes = {
  middle: P.oneOf(['ID da Cob.', 'ID do Clie.']),
  end: P.oneOf(['Valor', 'CPF'])
}
