import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme, color }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    min-width: 30rem;
    gap: 1.5rem;
    padding: 1.5rem 4rem;
    background-color: ${color};
    border-radius: 1rem;

    > div {
      display: flex;
      flex-direction: column;
      margin: 0 auto;
      align-items: center;
      gap: 0.5rem;
      text-align: justify;
    }
  `}
`;
export const CardName = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.grays.gray2};
    font-size: 1.2rem;
    font-weight: 900;
  `}
`;
export const CardImage = styled.img`
  ${({ theme }) => css`
    width: 2.4rem;
  `}
`;
export const Value = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.grays.gray2};
    font-size: 1.5rem;
    font-weight: 900;
  `}
`;
