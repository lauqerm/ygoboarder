import styled from 'styled-components';

const CreditContainer = styled.div`
    height: 100%;
    padding: var(--spacing-sm);
    background-color: var(--dim);
    word-break: break-word;
`;
export const Credit = () => {
    return <CreditContainer>
        Credit
    </CreditContainer>;
};