import P from 'prop-types';
import * as Styled from './styles';
import { Nav as Menu } from '../../components/Menu/Nav';
import { TopBar } from '../../components/TopBar'
import { useLocation } from 'react-router-dom';
import { useContext, useMemo } from 'react';
import { MyContext } from '../../components/Contexts';
import { Feedback } from '../../components/Cards/FeedbackCard';

export const Base = ({ children, page }) => {
  const {feedbackActive} = useContext(MyContext);

  return (
    <Styled.Base>
      <Menu />
      <Styled.Container>
        <TopBar
          page={page}
        />
        {children}
      </Styled.Container>
      {feedbackActive && <Feedback />}
    </Styled.Base>
  );
};

Base.propTypes = {
  children: P.node.isRequired,
  page: P.string.isRequired,
};
