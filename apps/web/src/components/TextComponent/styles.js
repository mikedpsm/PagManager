import styled, { css } from 'styled-components';

export const Container = styled.span`
  ${({ theme, color, weight }) => css`
    color: ${color};
    font-weight: ${weight};
  `}
`;
