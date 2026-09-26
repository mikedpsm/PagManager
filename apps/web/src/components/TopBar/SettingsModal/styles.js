import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: row;
    gap: 1rem;
    min-width: 5rem;
    height: 3rem;
    padding: 1rem;
    background-color: white;

    > div {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.8rem;

      > img {
        width: 1.4rem;
      }
    }
  `}
`;
