import styled, { css } from 'styled-components';

export const Container = styled.div`
  ${({ theme, styleFb }) => css`
    background-color: ${styleFb === 'success' ? theme.colors.feedback.successLight : theme.colors.feedback.errorLight};
    color: ${styleFb === 'success' ? theme.colors.feedback.successDark : theme.colors.feedback.errorDark};
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    bottom: 15px;
    right: 15px;
    padding: 1.5rem 2rem;
    font-weight: 700;
    max-width: 40rem;
    border-radius: 1.5rem;
     > div {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
      gap: 1rem;
      > span {
        font-size: 1.2rem;
      }
    }
    > img {
      cursor: pointer;
    }
  `}
`;
