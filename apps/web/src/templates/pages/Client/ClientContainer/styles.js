import styled, { css } from 'styled-components';
import { Container as ChargesContainer } from '../../../../components/ChargesContainer/styles'

export const Container = styled.div`
  ${({ theme }) => css`
    width: 100%;
    height: 90%;
    > .client_title {
      display: flex;
      flex-direction: row;
      gap: 2rem;
      > h1 {
        font-size: 2.8rem;
      }
    }

    > .client_container {
      padding: 3rem;
      width: 100%;
      > .client_container_title {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3rem;
        > .client_edit {
          display: flex;
          cursor: pointer;
          flex-direction: row;
          align-items: center;
          gap: 1rem;
          border: 0.1rem solid ${theme.colors.grays.gray5};
          padding: 0.3rem 3.5rem;
          border-radius: .5rem;
          > span {
            color: ${theme.colors.defaults.green};
          }
          > img {
            width: 1.4rem;
          }
        }
      }

      > .client_fields {
        display: flex;
        flex-direction: column;
        gap: 5rem;

        > .client_ids, .client_address {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10%;
          > .client_field {
            > h6 {
              font-size: 1.2rem;
            }
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      }
    }

    > .client_charges_container {
      padding: 3rem;
      width: 100%;
      > .client_container_title {
        display: flex;
        justify-content: space-between;

        > .new_charge {
          padding: .5rem 6rem;
          background-color: ${theme.colors.defaults.pink};
          color: white;
          font-weight: 500;
          font-size: 1.2rem;
          border-radius: .5rem;
          cursor: pointer;
        }
      }
    }
  `}
`;
