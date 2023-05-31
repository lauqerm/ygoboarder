import styled from 'styled-components';

export const AppMenuContainer = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    border: var(--bd);
    border-left: none;
    border-top-right-radius: var(--br);
    border-bottom-right-radius: var(--br);
    margin: var(--spacing) 0;
    overflow: hidden;
    .menu-button {
        background-color: var(--main-metal);
        color: var(--contrast-metal);
        cursor: pointer;
        padding: var(--spacing-xs) var(--spacing-sm);
        + .menu-button {
            border-top: var(--bd);
        }
        &:hover {
            background-color: var(--dim-metal);
        }
    }
`;