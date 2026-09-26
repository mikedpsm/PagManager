import styled, { css, keyframes } from 'styled-components';

const loading = () => keyframes`
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
`;

export const Container = styled.div`
  ${({ theme }) => css`
    position: absolute;
    inset: 0;
    z-index: 10;
    background-color: ${theme.colors.grays.gray3};
    &:before, &:after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border-width: 0.5rem;
      border-style: solid;
      border-color: transparent;
      border-radius: 50%;
    }
    &:after {
      width: 6rem;
      height: 6rem;
      border-left: 0.5rem solid ${theme.colors.grays.gray8};
      border-top: 0.5rem solid ${theme.colors.grays.gray8};
      animation: ${loading()} 1s linear infinite;
    }
    &:before {
      width: 2rem;
      height: 2rem;
      border-left: 0.5rem solid ${theme.colors.defaults.pink};
      border-top: 0.5rem solid ${theme.colors.defaults.pink};
      animation: ${loading()} 0.5s linear reverse infinite;
    }
    `}
`;
