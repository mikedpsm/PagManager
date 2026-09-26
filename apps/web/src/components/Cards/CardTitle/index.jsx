import P from 'prop-types';
import * as Styled from './styles';
import { colorSelector } from './selector'
import { useEffect } from 'react';
import { useState } from 'react';

export const CardTitle = ({ title_name = '', clients_count = 0 }) => {
  const [selected, setSelected] = useState({});

  useEffect(() => {
    const color = colorSelector(title_name);

    color && setSelected(color);
  }, [title_name]);

  return (
    <Styled.Container>
      <div>
        {selected.src && <Styled.Image src={selected.src} />}
        <Styled.Title as='h3'>{title_name}</Styled.Title>
      </div>
      <Styled.TitleCount back={selected.backgroundColor} color={selected.color}>{clients_count}</Styled.TitleCount>
    </Styled.Container>
  );
};

CardTitle.propTypes = {
  title_name: P.string.isRequired,
  clients_count: P.number.isRequired,
  src: P.string,
};
