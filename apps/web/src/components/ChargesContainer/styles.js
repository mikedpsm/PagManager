import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme }) => css`
    width: 100%;
    padding: 2rem 0;
    height: auto;
    border-radius: 2rem;
    box-shadow: 0.5rem 0.5rem 1rem ${theme.colors.grays.gray5};

    > .charges_container {
      min-height: 65vh;
    }

    > .btn {
      width: 100%;
      text-align: center;
    }
  `}
`;
