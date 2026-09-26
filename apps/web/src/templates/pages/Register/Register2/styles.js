import styled, { css } from 'styled-components';

export const Container = styled.div`
  $${({ theme }) => css`
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: row;
  `}
`;

export const Right = styled.div`
  ${({ theme }) => css`
    height: 100vh;
    width: 60%;
    display: flex;
    padding: 0 25rem;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    > h1 {
      position: relative;
      bottom: 7rem;
    }

    > img {
      max-width: 15rem;
      position: relative;
      top: 15rem;
    }

  `}
`;

export const Left = styled.div`
 ${({ theme }) => css`
    display: flex;
    flex-direction: row;
    gap: 3rem;
    height: 100vh;
    width: 40%;
    background-color: ${theme.colors.grays.gray7};
    padding: 12rem 5rem;
    > img {
      max-height: 15rem;
    }

    .step-description {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      max-height: 15rem;
      > div {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        > h3 {
          color: ${theme.colors.defaults.green};
          font-weight: 600;
          font-size: 1.6rem;
        }
        > p {
          font-size: 1.4rem;
        }
      }
    }
  `}
`;
