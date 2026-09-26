import P from 'prop-types';
import { Base } from '../../Base';
import * as Styled from './styles';
import { ClientsContainer } from '../../../components/ClientsContainer';
import { MiddleDiv } from '../../../components/MiddleDiv';
import { useState } from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import { MyContext } from '../../../components/Contexts';

export const ClientsPage = () => {
  const [clients, setClients] = useState([]);

  const {
    user,
    setFeedbackMessage,
    setFeedbackType,
    setFeedbackActive,
    loading
  } = useContext(MyContext);


  useEffect(() => {
    const token = localStorage.getItem('token');

    if (user && token) (async () => {
       try {
        const req = await fetch(`http://localhost:8000/api/debtors/user/${user.id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (req.status !== 200) throw new Error(res.error);

        const res = await req.json();
        setClients(res);
      } catch (error) {
        console.error(error.message);
      }
    })()
  }, [user])

  return (
    <Styled.Container>
      <Base page={'Clientes'}>
        <MiddleDiv page='Clientes'/>
        <ClientsContainer clients={clients} />
      </Base>
    </Styled.Container>
  );
};
