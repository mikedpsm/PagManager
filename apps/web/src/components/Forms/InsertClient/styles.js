import styled, { css } from 'styled-components';
import { Container as Button } from '../../Button/styles'

export const Container = styled.div`
  ${({ theme }) => css`
    margin: 0 auto;
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${theme.colors.defaults.modalBlur};
    > .form_container {
      width: 50rem;
      padding: 3rem 5rem;
      background-color: white;
      border-radius: 2rem;
      > .form_top {
        margin-bottom: 2rem;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        > img {
          cursor: pointer;
        }
        > .form_title {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
      }
      > form {
        > .asides_middle, .asides_bottom {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-column-gap: 3rem;
        }
        > .bottom_btn {
          > span, Button {
            margin: auto;
          }
          > span {
            border: 0.1rem solid ${theme.colors.grays.gray5};
            padding: 1rem 3.5rem;
            border-radius: 0.7rem;
            color: ${theme.colors.defaults.green};
            cursor: pointer;
          }
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          margin-top: 2rem;
        }
      }

    }
  `}
`;
