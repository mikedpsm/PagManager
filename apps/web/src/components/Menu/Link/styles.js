import styled, { css } from 'styled-components';
import { useLocation, NavLink } from 'react-router-dom';
import { TextComponent } from '../../TextComponent';



export const Container = styled(NavLink)`
  ${({ theme, selected }) => css`
    display: flex;
    flex-direction: column;
    width: 100%;
    align-items: center;

    > span {
      font-weight: lighter;
      color: ${selected ? theme.colors.defaults.pink : theme.colors.grays.gray2};
    }

    &.active {
      border-right: 0.15rem solid ${theme.colors.defaults.pink}
    }
  `}
`;


export const Image = styled.img`
  ${() => css`
    max-width: 2.4rem;
  `}
`;
