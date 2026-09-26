import P from 'prop-types';
import * as Styled from './styles';
import addCharge from '../../../assets/add-charge.svg';
import { useEffect, useState } from 'react';
import { colorSelector } from './selector';
import { InsertCharges } from '../../Forms/InsertCharges';
import { useContext } from 'react';
import { MyContext } from '../../Contexts';
import { Link } from 'react-router-dom';

export const ClientFields = ({ name, email, cpf, phone, status, id }) => {
  const [statusStyle, setStatusStyle] = useState({});
  const {insertChargeForm, setInsertChargeForm, editCharge, setEditCharge,} = useContext(MyContext);

  useEffect(() => {
    const style = colorSelector(status);

    style && setStatusStyle(style)
  }, [status]);

  const truncate = (value) => {

    if (value.length > 20) {
      return value.slice(0, 20) + '...';
    }
    return value;
  }

  const charge = {
    debtor: {
      name,
      email,
      cpf,
      phone,
      status,
      id
    }
  }

  const handleNewCharge = () => {
    setInsertChargeForm(true);
    setEditCharge(charge);
  }

  return (
    <Styled.Container statBg={statusStyle.backgroundColor} statColor={statusStyle.color}>
      {insertChargeForm && <InsertCharges />}
      <td><Link to={`/clients/client?debtor_id=${id}`}>{truncate(name)}</Link></td>
      <td>{cpf}</td>
      <td>{email}</td>
      <td>
        {phone ? phone : 'Insira um número de Telefone'}
      </td>
      <td className='status_field'>{statusStyle.status}</td>
      <td className='charge_img' onClick={handleNewCharge}>
        <img src={addCharge} alt="" />
        Cobrança
      </td>
    </Styled.Container>
  );
};

ClientFields.propTypes = {
  name: P.string.isRequired,
  email: P.string.isRequired,
  cpf: P.string.isRequired,
  phone: P.string,
  status: P.string.isRequired,
  id: P.number.isRequired,

};
