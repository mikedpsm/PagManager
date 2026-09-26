import P from 'prop-types';
import * as Styled from './styles';
import { CardTitle } from '../CardTitle';
import { CardFields } from '../CardFields';
import { Charge } from './Charge';
import { CardButton } from '../CardButton'

export const ClientsCard = ({ title, data = [] }) => {
  return (
    <Styled.Container>
      <CardTitle title_name={title} clients_count={data.length} />
      <CardFields middle='ID do Clie.' end='CPF' />
      <div className='container_clients'>
        {data && data.map((client) =>
          <Charge object={client} key={client.id} />
        )}
      </div>
      <CardButton />
    </Styled.Container>
  );
};

ClientsCard.propTypes = {
  title: P.string.isRequired,
  data: P.arrayOf(
    P.shape({
      name: P.string.isRequired,
      id: P.number.isRequired,
      update_at: P.string
    })
  ),
};
