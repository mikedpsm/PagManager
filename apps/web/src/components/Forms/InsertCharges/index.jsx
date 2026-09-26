import P from 'prop-types';
import { useState } from 'react';
import * as Styled from './styles';
import charges from '../../../assets/charge.svg';
import close from '../../../assets/x.svg';
import { Input } from '../Input';
import { Button } from '../../Button';
import { useContext } from 'react';
import { MyContext } from '../../Contexts';

export const InsertCharges = ({ edit }) => {
  const {
    user,
    insertChargeForm,
    setInsertChargeForm,
    setFeedbackMessage,
    setFeedbackType,
    setFeedbackActive,
    editCharge, setEditCharge,
  } = useContext(MyContext);

  const [chargeStatus, setChargeStatus] = useState('paid');

  const token = localStorage.getItem('token');
  const emissionDate = () => {
    const date = new Date();

    const dd = date.getDate();
    const mm = date.getMonth() + 1;
    const yy = date.getFullYear();

    return `${yy}-${mm.toString().padStart(2, '0')}-${dd.toString().padStart(2, '0')}`;
  }

  const handleEditSubmit = (e) => {
    const editData = {
      users_id: user.id,
      debtor_id: editCharge?.debtor?.id,
      emission_date: emissionDate(),
      description: e.target[1].value,
      due_date: e.target[2].value,
      amount: e.target[3].value,
      status: chargeStatus,
      _method: 'PATCH'
    }

    fetch(`http://localhost:8000/api/installments/${editCharge.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(editData),
    }).then(p => p.json()).then(r => {
      setFeedbackMessage(r.msg);
      setFeedbackType('success');
      setFeedbackActive(true);
    }).catch(err => {
      setFeedbackMessage(err.message);
      setFeedbackType('fail');
      setFeedbackActive(true);
    }).finally(() => setInsertChargeForm(false));
  }

  const handleSubmit = (e) => {
    const newData = {
      users_id: user.id,
      debtor_id: editCharge?.debtor?.id,
      emission_date: emissionDate(),
      description: e.target[1].value,
      due_date: e.target[2].value,
      amount: e.target[3].value,
      status: chargeStatus,
    }

    fetch(`http://localhost:8000/api/installments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newData),
    }).then(p => p.json()).then(r => {
      setFeedbackMessage(r.msg);
      setFeedbackType('success');
      setFeedbackActive(true);
    }).catch(err => {
      if (err.status === 404) {
        setFeedbackMessage('Não encontrado!');
      } else {
        setFeedbackMessage(err.message);
      }
      setFeedbackType('fail');
      setFeedbackActive(true);
    }).finally(() => setInsertChargeForm(false));
  }

  const modeController = (event) => {
    event.preventDefault();

    if (edit) {
      return handleEditSubmit(event);
    } else {
      return handleSubmit(event);
    }
  }

  const handleCloseClick = () => {
    setEditCharge(false);
    setInsertChargeForm(false);
  }

  return (
    <Styled.Container>
      <div className='form_container'>
        <div className='form_top'>
          <div className='form_title'>
            <img src={charges} alt="Clients" />
            <h1>{edit ? 'Editar' : 'Cadastro de'} Cobrança</h1>
          </div>
          <img src={close} alt="" onClick={handleCloseClick}/>
        </div>
        <form onSubmit={modeController}>
          <Input
            label='Nome'
            required
            autoComplete={editCharge?.debtor?.name}
            ph='Insira o Nome'
            type='text'
          />
          <Input
            label='Descrição'
            required
            autoComplete={editCharge && editCharge?.description}
            ph='Insira a descrição'
            type='text'
          />
          <div className="asides">
            <Input
              label='Vencimento'
              required
              autoComplete={editCharge && editCharge?.due_date}
              ph='dd/mm/aaaa'
              type='date'
            />
            <Input
              label='Valor'
              required
              autoComplete={editCharge && editCharge?.amount}
              ph='Insira o Valor'
              type='number'
            />
          </div>
          <div className='charge_status'>
            <span>Status*</span>
            <div className='status'>
              <div>
                <input
                  type="radio"
                  id='status_paid'
                  name='charge_status'
                  value='Paid'
                  defaultChecked={editCharge.status === 'Paid'}
                  onChange={() => setChargeStatus('Paid')}
                />
                <label htmlFor="status_paid">Cobrança Paga</label>
              </div>
              <div>
                <input
                  type="radio"
                  id='status_pending'
                  name='charge_status'
                  value='Pending'
                  defaultChecked={editCharge.status === 'Pending'}
                  onChange={() => setChargeStatus('Pending')}
                 />
                <label htmlFor="status_pending">Cobrança Pendente</label>
              </div>
            </div>
          </div>
          <div className='bottom_btn'>
            <span>Cancelar</span>
            <Button type='submit'>
              Aplicar
            </Button>
          </div>
        </form>
      </div>
    </Styled.Container>
  );
};

InsertCharges.propTypes = {
  charge: P.object,
  edit: P.bool
};
