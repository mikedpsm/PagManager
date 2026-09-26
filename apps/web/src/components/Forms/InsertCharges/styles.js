import styled, { css } from 'styled-components';

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
      max-width: 40rem;
      min-height: 50rem;
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
        > .asides {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-column-gap: 1.5rem;
          input[type="date"] {
            display: flex;
            flex-direction: row;
            align-items: center;
          }
        }
        > .charge_status {
          > span {
            font-size: 1.4rem;
          }
          > .status {
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
              margin-top: 3rem;
            > div {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 1.4rem;
              padding-left: 3rem;
              input[type="radio"] {
                cursor: pointer;
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                background-color: ${theme.colors.grays.gray3};
                outline: none;
              }
              input[type="radio"]:checked {
                background-color: ${theme.colors.defaults.green};
              }
              input[type="radio"]:hover + label {
                cursor: pointer;
              }
              input[type="radio"]:not(:checked) {
                background-color: ${theme.colors.grays.gray3};
              }
              label {
                font-size: 1.8rem;
              }
            }
          }
        }
        > .bottom_btn {
          position: relative;
          top: 3rem;
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
