import P from 'prop-types';
import { SearchInput } from '../Search';
import * as Styled from './styles';
import charge from '../../assets/charge.svg';
import clients from '../../assets/clients.svg';
import filter from '../../assets/filter-1.svg';
import { InsertClient } from '../Forms/InsertClient';
import { useContext } from 'react';
import { MyContext } from '../Contexts';


export const MiddleDiv = ({ page = '' }) => {
  const {insertClientForm, setInsertClientForm} = useContext(MyContext);
  return (
    <Styled.Container>
      {insertClientForm && <InsertClient />}
      <div className='page_middle_title'>
        {page === 'Cobranças' && <img src={charge} alt="Charge" />}
        {page === 'Clientes' && <img src={clients} alt="Charge" />}
        <span>{page}</span>
      </div>
      <div className='page_middle_search'>
        {page === 'Clientes' &&
          <Styled.AddClient onClick={() => setInsertClientForm(true)}>
            <span>+ Adicionar Cliente</span>
          </Styled.AddClient>
        }
        <img src={filter} alt="Charge" />
        <SearchInput />
      </div>
    </Styled.Container>
  );
};

MiddleDiv.propTypes = {
  page: P.string.isRequired,
};
