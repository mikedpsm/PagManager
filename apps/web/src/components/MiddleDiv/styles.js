import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    max-height: 4rem;
    padding: 0 7rem;

    > .page_middle_title {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 1rem;

      > img {
        width: 3.4rem;

      }

      > span {
        font-weight: 900;
        color: ${theme.colors.grays.gray2};
        font-size: 2.4rem;
      }
    }

    > .page_middle_search {
      display: flex;
      flex-direction: row;
      gap: 1.5rem;
      align-items: center;
      > img {
        width: 3.8rem;
        background-color: white;
        padding: 0.3rem;
        border-radius: 1.5rem;
        cursor: pointer;
      }
    }
  `}
`;

export const AddClient = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.defaults.pink};
    padding: 0.8rem 6rem;
    border-radius: 1rem;
    color: white;
    cursor: pointer;
  `}
`;
