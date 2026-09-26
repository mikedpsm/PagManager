import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-bottom: 0.1rem solid ${theme.colors.grays.gray3};
    padding: 0 1rem 0.8rem 1rem;
    margin-top: 0.8rem;
    text-align: start;
    > .value_field {
      text-align: start;
    }
  `}
`;
export const Field = styled.span`
  ${({ theme }) => css`
    width: 17%;
    font-weight: 900;
    color: ${theme.colors.grays.gray1};
    text-align: center;
  `}
`;
