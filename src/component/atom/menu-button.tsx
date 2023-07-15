import styled from 'styled-components';

export const MenuButton = styled.div`
    background-color: var(--main-metal);
    color: var(--contrast-metal);
    cursor: pointer;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-top: var(--bd);
    :not(:first-child) {
        border-top: var(--bd);
    }
    &:hover {
        background-color: var(--dim-metal);
    }
`;
export const MenuLabel = styled.label`
    background-color: var(--main-metal);
    color: var(--contrast-metal);
    cursor: pointer;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-top: var(--bd);
    :not(:first-child) {
        border-top: var(--bd);
    }
    &:hover {
        background-color: var(--dim-metal);
    }
`;