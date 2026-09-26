import P from 'prop-types';
import * as Styled from './styles';
import edit from '../../../assets/edit.svg';
import exit from '../../../assets/logout.svg';
import { EditRegister } from '../../Forms/EditRegister'
import { useState } from 'react';
import { useContext } from 'react';
import { MyContext } from '../../Contexts';
import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const SettingsModal = () => {
  const { editUserModal, setEditUserModal, setUser } = useContext(MyContext);

  const logout = () => {
    setUser({});
    localStorage.clear();
    return <Navigate to='/' />
  };

  return (
    <Styled.Container>
      {editUserModal && <EditRegister />}
      <div onClick={() => setEditUserModal(true)}>
        <img src={edit} alt="edit user" />
        <span>Editar</span>
      </div>
      <div>
        <img src={exit} alt="logout" onClick={() => logout()} />
        <span>Sair</span>
      </div>
    </Styled.Container>
  );
};
