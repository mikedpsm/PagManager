import styled, { css } from 'styled-components';

export const Container = styled.button`
  ${({ theme }) => css`
    all: unset;
    padding: 1rem 3.5rem;
    border-radius: 0.7rem;
    background-color: ${theme.colors.defaults.pink};
    color: ${theme.colors.grays.gray8};
    cursor: pointer;
    max-width: 10%;
    text-align: center;
    margin: 0 auto;
  `}
`;
