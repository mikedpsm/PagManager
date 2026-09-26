import * as Styled from './styles'
import { Base } from '../../Base';
import { useState, useEffect, useCallback, useContext } from 'react';
import { AmountCard } from '../../../components/Cards/Amount';
import { ChargesCard } from '../../../components/Cards/ChargesCard';
import { ClientsCard } from '../../../components/Cards/ClientsCard';
import { Navigate } from 'react-router-dom';
import { MyContext } from '../../../components/Contexts';
import { Loading } from '../../../components/Loading';
import { filterAmounts, filteredClients } from './_utils/homeReq';

export const Home = () => {
  const { user, setUser } = useContext(MyContext);
  const [amounts, setAmounts] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let loyal = null;
    let debtor = null;
    if (user && token) (async () => {
      try {
        const req = await fetch(`http://localhost:8000/api/installments?filter=users_id:=:${user.id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (req.status !== 200) throw new Error(res.error);

        const res = await req.json();

        const filteredData = filterAmounts(res);

        setAmounts(filteredData);
      } catch (error) {
        console.error(error.message);
      }

      try {
        const req = await fetch(`http://localhost:8000/api/debtors/defaulters/user/${user.id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (req.status !== 200) throw new Error(res.error);

        const res = await req.json();

        debtor = res;
      } catch (error) {
        console.error(error.message);
      }

      try {
        const req = await fetch(`http://localhost:8000/api/debtors/payers/user/${user.id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (req.status !== 200) throw new Error(res.error);

        const res = await req.json();

        loyal = res;
      } catch (error) {
        console.error(error.message);
      }

      if (loyal && debtor) {
        setClients([
          {
            title: 'Clientes Inadimplentes',
            obj: debtor
          },
          {
            title: 'Clientes Em Dia',
            obj: loyal
          }
        ]);

      }
    })();
  }, [user]);

  return (
    <Styled.Container>
      <Base page='Início'>
        <div className='Amount'>
          {amounts && amounts.map(amount =>
            <AmountCard
              amount={amount.value}
              name={amount.name}
              key={amount.name}
            />
          )}
        </div>
        <div className='Charges'>
          {amounts && amounts.map(charge =>
            <ChargesCard
              key={charge.name + ' Charge'}
              charges={charge.obj}
              name={charge.name}
            />
          )}
        </div>
        <div className='Clients'>
          {clients && clients.map(client =>
            <ClientsCard
              key={client.title}
              data={client.obj}
              title={client.title}
            />
          )}
        </div>
      </Base>
    </Styled.Container>
  );
}

export default Home;
