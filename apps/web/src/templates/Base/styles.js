import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 1.5rem 3rem;
    gap: 1.5rem;
    background-color: ${theme.colors.grays.gray7};
  `}
`;
export const Base = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: row;

    .Amount, .Charges, .Clients {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }
  `}
`;
