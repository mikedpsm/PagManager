import P from 'prop-types';
import * as Styled from './styles';
import { TextComponent } from '../../TextComponent';

export const Link = ({ src, link = '#', alt = '', page = '', selected = false }) => {

  return (
    <Styled.Container to={link} selected={selected} >
      <Styled.Image src={src} alt={alt} />
      <span>{page}</span>
    </Styled.Container>
  );
};

Link.propTypes = {
  src: P.string.isRequired,
  link: P.string.isRequired,
  alt: P.string.isRequired,
  page: P.string.isRequired,
  selected: P.bool.isRequired
};
