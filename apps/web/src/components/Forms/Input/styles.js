import styled, { css } from 'styled-components';

export const Container = styled.input`
  ${({ theme, type }) => css`
    all: unset;
    cursor: initial;
    min-height: 2.4rem;
    width: 100%;
  `}
`;

export const Label = styled.label`
  ${({ theme, equal }) => css`
  margin-top: 1rem;

  ${!equal && css`
    &::after {
      content: 'As senhas devem ser iguais';
      color: ${theme.colors.feedback.error}
    }
  `}
  ${equal && css`
    &::after {
      content: '';
    }
  `}

  > div{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 0.7rem;
    > a {
      text-decoration: underline;
      color: ${theme.colors.defaults.pink}
    }
    > span {
      font-weight: 700;
      color: ${equal ? theme.colors.grays.gray2 : theme.colors.feedback.error};
    }
  }



  .input {
    cursor: text;
    width: 100%;
    border-radius: 0.6rem;
    margin-top: 0.3rem;
    border: ${equal ? `0.1rem solid ${theme.colors.grays.gray4}` : `0.1rem solid ${theme.colors.feedback.error}`};
    padding: 0.7rem;

    > img {
      cursor: pointer;
      width: 2.4rem;
    }

    :focus {
      border: 0.1rem solid ${theme.colors.grays.gray1};
    }
  }
  `}
`;
