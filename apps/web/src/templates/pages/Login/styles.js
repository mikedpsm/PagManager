import styled, { css } from 'styled-components';

export const Right = styled.div`
  ${({ theme }) => css`
    width: 60%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0 25rem;
    gap: 3rem;
    & > h1 {
      color: ${theme.colors.grays.gray2};
      text-align: center;
    }
  `}
`;

export const Left = styled.div`
  ${({ theme }) => css`
    width: 40%;
    margin: 0 auto;
    padding: 10rem;
    text-align: center;
    font-weight: 700;
    font-size: 2.4rem;
    color: ${theme.colors.defaults.green};

    > img {
      width: 40%;
      max-height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      z-index: -1;
    }
  `}
`;

export const Container = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: row;
    height: 100vh;
  `}
`;


