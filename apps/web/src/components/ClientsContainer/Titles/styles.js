import styled, { css } from 'styled-components';

export const Container = styled.tr`
  ${({ theme }) => css`
  width: 100%;
  margin-bottom: 1.5rem;
  padding-right: 2.5rem;
  padding-left: 2.5rem;
  border-bottom: 0.1rem solid ${theme.colors.grays.gray4};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  max-height: 3rem;
    > th {
      width: 8%;
      gap: 1rem;
      font-weight: bold;
      font-size: 1.4rem;
      color: ${theme.colors.grays.gray2};
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 2rem;
      > img {
        width: 1rem;
      }
    }
  `}
`;
