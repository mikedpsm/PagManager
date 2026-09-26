import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

export const Container = styled.tr`
  ${({ theme, statBg, statColor }) => css`
    width: 100%;
    text-align: start;
    max-height: 2rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem 1.5rem 2rem;
    color: ${theme.colors.grays.gray2};
    border-bottom: 1px solid ${theme.colors.grays.gray4};

    > td {
      width: 8%;
      text-align: center;
    }

    > .status_field {
      text-align: center;
      color: ${statColor};
      background-color: ${statBg};
      border-radius: 2rem;
    }

    > .charge_img {
      display: flex;
      flex-direction: column;
      justify-content: start;
      align-items: center;
      color: ${theme.colors.defaults.pink};
      font-size: 0.7rem;
      cursor: pointer;
      > img {
        margin: 0 0.4rem;
        width: 2rem;
      }
    }
  `}
`;

export const ClientLink = styled(Link)`
  ${({ theme }) => css`
    min-width: 100%;
  `}
`;
