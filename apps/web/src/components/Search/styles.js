import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    max-width: 25rem;
    padding: 0.8rem 2rem;
    border-bottom: 2px solid ${theme.colors.defaults.lightPink};
    border-radius: 1rem;
    > input {
      all: unset;
      cursor: initial;
      width: 100%;
    }
  `}
`;
