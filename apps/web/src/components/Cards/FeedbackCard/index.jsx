import P from 'prop-types';
import { useContext, useEffect, useState } from 'react';
import * as Styled from './styles';
import { MyContext } from '../../Contexts';
import closeFail from '../../../assets/x-error.svg';
import closeSuccess from '../../../assets/x-success.svg';
import success from '../../../assets/circle-check.svg';
import fail from '../../../assets/x-circle.svg';

export const Feedback = () => {
  const {
    setFeedbackActive, feedbackType, setFeedbackType, feedbackMessage, setFeedbackMessage
  } = useContext(MyContext);

  function closeModal() {
    setFeedbackActive(false);
    setFeedbackType('success');
    setFeedbackMessage('');
    return;
  }

  setTimeout(closeModal, 3000);

  return (
    <Styled.Container styleFb={feedbackType}>
      <div>
        <img src={feedbackType === 'success' ? success : fail} alt='Status'/>
        <span>{feedbackMessage}</span>
      </div>
      <img src={feedbackType === 'success' ? closeSuccess : closeFail} alt="Close" onClick={() => setFeedbackActive(false)}/>
    </Styled.Container>
  );
};
