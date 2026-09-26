import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme, status_bg, status_color }) => css`
    border-bottom: 1px solid ${theme.colors.grays.gray4};
    padding: 0 2rem 1.5rem 2rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    max-height: 3rem;
    width: 100%;

    > .container {
      width: 80%;
      text-align: start;
      max-height: 2rem;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      color: ${theme.colors.grays.gray2};

      > span {
        width: 9rem;
      }
      > .status_field {
        background-color: ${status_bg};
        color: ${status_color};
        text-align: center;
        border-radius: 1rem;
      }
    }
    > .icons {
      width: 8%;
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
      gap: 1rem;
      > .delete_icon {
        color: ${theme.colors.feedback.errorDark};
      }
      > span {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        > img {
          max-width: 1.8rem;
        }
      }
    }
  `}
`;
