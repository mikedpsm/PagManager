import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme }) => css`
  width: 100%;
  margin-bottom: 1.5rem;
  padding: 0 2rem 1rem 2rem;
  border-bottom: 0.1rem solid ${theme.colors.grays.gray4};
    > div {
      width: 80%;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;

      > span {
        display: flex;
        width: 9rem;
        flex-direction: row;
        align-items: center;
        text-align: start;
        gap: 1rem;
        font-weight: bold;
        font-size: 1.4rem;
        color: ${theme.colors.grays.gray2};
        > img {
          width: 1rem;
          margin: 0;
        }
      }
    }
  `}
`;
