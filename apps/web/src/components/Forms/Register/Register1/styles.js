import styled, { css } from 'styled-components';

export const Container = styled.form`
  ${({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    > Button {
      margin-top: 3rem;
    }

    > p {
      text-align: center;
      > a {
       text-decoration: underline;
       color: ${theme.colors.defaults.pink};
     }
    }
  `}
`;
