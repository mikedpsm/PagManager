import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 0.1rem solid ${theme.colors.grays.gray5};
    padding: 0 2rem 0.5rem 2rem;
    margin-top: 1.5rem;
  `}
`;

export const Info = styled.span`
  ${({ theme }) => css`
    text-align: center;
    min-width: 30%;
    color: ${theme.colors.grays.gray3};
  `}
`;
