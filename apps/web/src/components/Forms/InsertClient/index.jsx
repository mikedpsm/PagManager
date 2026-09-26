import P from 'prop-types';
import * as Styled from './styles';
import { Input } from '../Input';
import clients from '../../../assets/clients.svg';
import close from '../../../assets/x.svg';
import { useState } from 'react';
import { Button } from '../../Button';
import { useContext } from 'react';
import {MyContext} from '../../Contexts/index';

export const InsertClient = ({ client, edit }) => {
  const {
    setInsertClientForm,
    user,
    setFeedbackMessage,
    setFeedbackType,
    setFeedbackActive
  } = useContext(MyContext);

  const token = localStorage.getItem('token');

  const handleSubmit = (e) => {
    const data = {
      user_id: user.id,
      name: e.target[0].value,
      email: e.target[1].value,
      cpf: e.target[2].value,
      phone: e.target[3].value,
      address: e.target[4].value,
      complement: e.target[5].value,
      cep: e.target[6].value,
      neighborhood: e.target[7].value,
      city: e.target[8].value,
      state: e.target[9].value,
    }

    fetch(`http://localhost:8000/api/debtors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }).then(p => p.json()).then(r => {
      setFeedbackMessage(r.msg);
      setFeedbackType('success');
      setFeedbackActive(true);
    }).catch(err => {
      setFeedbackMessage(err.msg);
      setFeedbackType('fail');
      setFeedbackActive(true);
    }).finally(() => setInsertClientForm(false));
  }

  const handleEditClient = (e) => {
    const data = {
      _method: 'PATCH',
      user_id: user.id,
      name: e.target[0].value,
      email: e.target[1].value,
      cpf: e.target[2].value,
      phone: e.target[3].value,
      address: e.target[4].value,
      complement: e.target[5].value,
      cep: e.target[6].value,
      neighborhood: e.target[7].value,
      city: e.target[8].value,
      state: e.target[9].value,
    }

    fetch(`http://localhost:8000/api/debtors/${client.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    }).then(p => p.json()).then(r => {
      setFeedbackMessage(r.msg);
      setFeedbackType('success');
      setFeedbackActive(true);
    }).catch(err => {
      setFeedbackMessage(err.msg);
      setFeedbackType('fail');
      setFeedbackActive(true);
    }).finally(() => setInsertClientForm(false));
  }

  const modeSelect = (event) => {
    event.preventDefault();

    if (edit) {
      handleEditClient(event);
    } else {
      handleSubmit(event);
    }
  }
  return (
    <Styled.Container>
      <div className='form_container'>
        <div className='form_top'>
          <div className='form_title'>
            <img src={clients} alt="Clients" />
            <h1>{edit ? 'Editar' : 'Cadastro do'} Cliente</h1>
          </div>
          <img src={close} alt="" onClick={() => setInsertClientForm(false)}/>
        </div>
        <form onSubmit={modeSelect}>
          <Input
            label='Nome'
            required
            autoComplete={client && client.name}
            ph='Insira o Nome'
            type='text'
          />
          <Input
            label='E-mail'
            required
            autoComplete={client && client.email}
            ph='Insira o Email'
            type='email'
          />
          <div className='asides_middle'>
            <Input
            label='CPF'
            required
            autoComplete={client && client.cpf}
            min={11}
            max={11}
            ph='Insira o CPF'
            type='number'
          />
          <Input
            label='Telefone'
            required
            autoComplete={client && client.phone}
            min={10}
            max={14}
            ph='Insira o Telefone'
            type='tel'
          />
          </div>
          <Input
            label='Endereço'
            autoComplete={client?.address && client.address}
            ph='Insira o Endereço'
            type='text'
          />
          <Input
            label='Complemento'
            autoComplete={client?.complement && client.complement}
            ph='Insira o Complemento'
            type='text'
          />
          <div className='asides_bottom'>
            <Input
            label='CEP'
            autoComplete={client?.cep && client.cep}
            ph='Insira o CEP'
            type='number'
            />
            <Input
              label='Bairro'
              autoComplete={client?.neighborhood && client.neighborhood}
              ph='Insira o Bairro'
              type='text'
            />
            <Input
              label='Cidade'
              autoComplete={client?.city && client.city}
              ph='Insira o Cidade'
              type='text'
            />
            <Input
              label='UF'
              autoComplete={client?.state && client.state}
              ph='Insira o UF'
              max={3}
              type='text'
            />
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

InsertClient.propTypes = {
  client: P.object,
  edit: P.bool,
}
