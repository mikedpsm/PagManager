import P from 'prop-types';
import { Base } from '../../Base';
import * as Styled from './styles';
import charge from '../../../assets/charge.svg';
import filter from '../../../assets/filter-1.svg';
import { MiddleDiv } from '../../../components/MiddleDiv';
import { ChargesContainer } from '../../../components/ChargesContainer';
import { useState } from 'react';
import { useContext } from 'react';
import { MyContext } from '../../../components/Contexts';
import { useEffect } from 'react';


export const ChargesPage = () => {
  const [data, setData] = useState([]);
  const { user } = useContext(MyContext);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) (async () => {
      try {
        const req = await fetch(`http://localhost:8000/api/installments?filter=users_id:=:${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (req.status !== 200) throw new Error(req.error);

        const res = await req.json();

        setData(res);
      } catch (error) {
        console.error;(error);
      }
    })();
  }, [user]);

  return (
    <Styled.Container>
      <Base page='Cobranças'>
        <MiddleDiv page='Cobranças' />
        <ChargesContainer charges={data} />
      </Base>
    </Styled.Container>
  );
};
