import styled, { css } from 'styled-components';

export const Success = styled.div`
  ${({ theme }) => css`
    width: 100%;
    max-height: 25rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: ${theme.colors.grays.gray7};
    padding: 25rem 10rem;
    padding-bottom: 18rem;
    border-radius: 3rem;
    > img {
      width: 6.4rem;
    }

    > p {
      font-size: 3rem;
      margin-top: 3rem;
      color: ${theme.colors.grays.gray2};
    }
  `}
`;

export const Container = styled.div`
  ${({ theme }) => css`
    text-align: center;
    > Button {
      margin-top: 3rem;
    }
  `}
`;
