import styled, { css } from 'styled-components';
import { Input } from '../Input';

export const Container = styled.div`
  ${({ theme }) => css`
    z-index: 8;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: ${theme.colors.defaults.modalBlur};
    position: fixed;
    inset: 0;
    > form {
      padding: 3rem 4rem;
      width: 45rem;
      background-color: white;
      border-radius: 2rem;
      > .asides {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        > label {
          width: 48%;
        }
      }

      > .btn {

        text-align: center;
        margin-top: 2rem;
      }
      > h1 {
        text-align: center;
        margin-bottom: 1rem;
      }
      > img {
        position: absolute;
        top: 1.5rem;
        right: 1.5rem;
        cursor: pointer;
        max-width: 2.4rem;
      }
    }


  `}
`;
