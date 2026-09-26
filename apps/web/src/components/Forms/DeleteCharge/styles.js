import styled, { css } from 'styled-components';

export const Modal = styled.div`
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
  `}
`;
export const Container = styled.div`
  ${({ theme }) => css`
    padding: 3rem 4rem;
    width: 45rem;
    min-height: 50%;
    background-color: white;
    border-radius: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    > img {
      width: 15rem;
    }
    > span {
      color: ${theme.colors.feedback.warning};
      font-size: 1.8rem;
      font-weight: bold;
    }
    > .btn_container {
      display: flex;
      flex-direction: row;
      margin-top: 4rem;
      gap: 3rem;
      > .close_delete_modal {
        color: ${theme.colors.feedback.error};
        background-color: ${theme.colors.feedback.errorLight};
        width: 7rem;
        text-align: center;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
      }
      > .delete_charge {
        cursor: pointer;
        width: 7rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        border-radius: 0.5rem;
        color: ${theme.colors.defaults.green};
        background-color: ${theme.colors.defaults.lightGreen};
        text-align: center;
      }
    }
  `}
`;
