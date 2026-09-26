import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    min-width: 30rem;
    border-radius: 1rem;
    padding-top: 1rem;
    box-shadow: 0.5rem 0.5rem 1rem ${theme.colors.grays.gray5};
    background-color: white;

    > .card_container {
      min-height: 17rem;
    }
  `}
`;
