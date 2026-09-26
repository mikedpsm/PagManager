import styled, { css } from 'styled-components';


export const Container = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    border-bottom: 0.1rem solid ${theme.colors.grays.gray5};
    padding-bottom: 0.5rem;
    max-height: 2.4rem;

    > div {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 1rem;
    }
  `}
`;

export const TitleCount = styled.span`
  ${({ theme, back, color }) => css`
    background-color: ${back};
    color: ${color};
    padding: 0.3rem 1.3rem;
    border-radius: 1rem;
    font-weight: 900;
  `}
`;

export const Title = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.grays.gray2}
  `}
`;

export const Image = styled.img`
  ${({ theme }) => css`
    max-width: 2rem;
  `}
`;
