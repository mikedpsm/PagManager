import P from 'prop-types';
import * as Styled from './styles';
import progress1 from '../../../../assets/progress1.svg';
import progress2 from '../../../../assets/progress2.svg';
import progress3 from '../../../../assets/progress3.svg';


export const ProgressBar = ({ stg }) => {
  function stage() {
    if (stg === 1) return progress1;
    if (stg === 2) return progress2;
    if (stg === 3) return progress3;
  }

  return (
    <Styled.Container src={stage()} />
  );
};

ProgressBar.propTypes = {
  stg: P.number.isRequired,
};
