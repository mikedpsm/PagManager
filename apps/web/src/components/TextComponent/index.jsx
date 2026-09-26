import P from 'prop-types';
import * as Styled from './styles';

export const TextComponent = ({ children, as = 'p', weight = '900', color = '#000000' }) => {
  return (
    <Styled.Container as={as} weight={weight} color={color}>
      {children}
    </Styled.Container>
  );
};

TextComponent.propTypes = {
  children: P.node.isRequired,
  as: P.oneOf(['p', 'span']),
  weight: P.number.isRequired,
  color: P.string.isRequired,
};
