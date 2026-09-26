import P from 'prop-types';
import * as Styled from './styles';
import { colorSelector } from './selector';

export const AmountCard = ({ amount = 0, name = '' }) => {
  const { backgroundColor, src } = colorSelector(name);

  return (
    <Styled.Container color={backgroundColor}>
      <Styled.CardImage src={src} />
      <div>
        <Styled.CardName>
          {name}
        </Styled.CardName>
        <Styled.Value>
          {amount.toLocaleString(
            'pt-br', { style: 'currency', currency: 'BRL' }
          )
          }
        </Styled.Value>
      </div>
    </Styled.Container>
  );
};

AmountCard.propTypes = {
  amount: P.number.isRequired,
  name: P.string.isRequired,
};
