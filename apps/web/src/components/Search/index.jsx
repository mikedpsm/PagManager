import P from 'prop-types';
import * as Styled from './styles';
import search from '../../assets/search.svg';

export const SearchInput = () => {
  return (
    <Styled.Container>
      <input type="text" placeholder='Pesquisar' />
      <img src={search} alt="Search" />
    </Styled.Container>
  );
};
