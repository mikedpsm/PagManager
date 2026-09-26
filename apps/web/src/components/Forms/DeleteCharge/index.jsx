import P from 'prop-types';
import * as Styled from './styles';
import alert from '../../../assets/triangle-warning.svg'
import { useContext } from 'react';
import { MyContext } from '../../Contexts';

export const DeleteCharge = ({ id }) => {
  const {
    setDeleteChargeForm,
    setFeedbackMessage,
    setFeedbackType,
    setFeedbackActive,
  } = useContext(MyContext);

  const token = localStorage.getItem('token');

  const handleDelete = () => {
    fetch(`http://localhost:8000/api/installments/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    }).then(p => p.json()).then(r => {
      setFeedbackMessage('Excluído com Sucesso');
      setFeedbackType('success');
      setFeedbackActive(true);
    }).catch(err => {
      setFeedbackMessage(err.message);
      setFeedbackType('fail');
      setFeedbackActive(true);
    }).finally(() => setDeleteChargeForm(false));
  }
  return (
    <Styled.Modal>
      <Styled.Container>
        <img src={alert} alt='alert'/>
        <span>Tem certeza que quer excluir essa cobrança</span>
        <div className='btn_container'>
          <div className="close_delete_modal" onClick={() => setDeleteChargeForm(false)}>
            <span>Não</span>
          </div>
          <div className="delete_charge" onClick={handleDelete}>
            <span>Sim</span>
          </div>
        </div>
      </Styled.Container>
    </Styled.Modal>
  );
};

DeleteCharge.propTypes = {
  id: P.number.isRequired,
};
