import styled, { css } from 'styled-components';
import { Container as SettingsModal } from '../SettingsModal/styles';

export const Container = styled.div`
  ${({ theme }) => css`
    position: relative;
    right: 0;

    > ${SettingsModal} {
      position: absolute;
      right: 0;
    }
  `};
`;

export const TopBar = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
  `}
`;

export const Aka = styled.span`
  ${({ theme }) => css`
    background-color: ${theme.colors.grays.gray6};
    padding: 1rem;
    border-radius: 50%;
    color: ${theme.colors.defaults.green};
    text-transform: uppercase;
    font-weight: 900;
  `}
`;

export const Name = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.defaults.green};
    font-weight: 600;
  `}
`;

export const Image = styled.img`
  ${({ theme }) => css`
    cursor: pointer;
    pointer-events: all;
  `}
`;
