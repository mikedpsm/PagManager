import P from 'prop-types';
import * as Styled from './styles';
import { ChargesTitles } from './Titles';
import { ChargesFields } from './Fields';
import { CardButton } from '../Cards/CardButton';


export const ChargesContainer = ({ charges = [] }) => {
  return (
    <Styled.Container>
      <ChargesTitles />
      <div className='charges_container'>
        {charges && charges.map((charge) =>
          <ChargesFields {...charge} key={charge.id_billing} />
        )}
      </div>
    </Styled.Container>
  );
};

ChargesContainer.propTypes = {
  charges: P.arrayOf(
    P.shape({
      debtor: P.object.isRequired,
      id_billing: P.string.isRequired,
      amount: P.number.isRequired,
      due_date: P.string.isRequired,
      description: P.string,
      status: P.string.isRequired,
    })
  ).isRequired,
};
