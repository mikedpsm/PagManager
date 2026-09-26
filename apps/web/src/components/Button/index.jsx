import P from 'prop-types';
import * as Styled from './styles';

export const Button = ({ children, type, onClick }) => {
  return (
    <Styled.Container type={type} onClick={onClick}>
      {children}
    </Styled.Container>
  );
};

Button.propTypes = {
  children: P.node.isRequired,
  type: P.string.isRequired,
  onClick: P.string,
};
