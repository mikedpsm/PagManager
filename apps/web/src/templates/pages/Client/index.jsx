import P from 'prop-types';
import { Base } from '../../Base';
import * as Styled from './styles';
import { Client } from './ClientContainer';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export const ClientPage = () => {
  const location = useLocation();

  const [debtor, setDebtor] = useState({});
  const [debtorCharges, setDebtorCharges] = useState([]);

  useEffect(() => {
    const param = new URLSearchParams(location.search);
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8000/api/debtors/${param.get('debtor_id')}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
    }).then(r => r.json()).then((data) => setDebtor(data)).catch(err => console.error(err))
    fetch(`http://localhost:8000/api/installments?filter=debtor_id:=:${param.get('debtor_id')}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
    }).then(r => r.json()).then((data) => setDebtorCharges(data)).catch(err => console.error(err))

  }, [location]);

  return (
    <Styled.Container>
      <Base page='Clientes > Detalhes do Cliente'>
        <Client client={debtor} charges={debtorCharges}/>
      </Base>
    </Styled.Container>
  );
};

