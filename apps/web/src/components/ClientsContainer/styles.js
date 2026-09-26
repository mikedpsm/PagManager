import styled, { css } from 'styled-components';

export const Container = styled.table`
  ${({ theme }) => css`
    width: 100%;
    padding: 2rem 0;
    border-radius: 2rem;
    box-shadow: 0.5rem 0.5rem 1rem ${theme.colors.grays.gray5};

  `}
`;
