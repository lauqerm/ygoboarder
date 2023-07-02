import styled from 'styled-components';

const CreditContainer = styled.div`
    height: 100%;
    padding: var(--spacing-sm);
    background-color: var(--dim);
    word-break: break-word;
    .my-name {
        font-weight: bold;
        color: var(--main-antd);
    }
    .my-app {
        font-size: var(--fs-lg);
    }
    ul {
        padding-inline-start: 2rem;
    }
`;
export const Credit = () => {
    return <CreditContainer>
        <span className="my-app">
            <b>Yugioh Boarder</b> v{process.env.REACT_APP_VERSION ?? 'unknown'}
        </span>
        <br />
        GUI: <span className="my-name">Lauqerm</span>
        <br />
        <b>Disclaimer:</b>
        <ul>
            <li>I do not own any image, icon or graphic component used in this project.</li>
            <li>Official card data, searching and image hosting are provided by YGOPRODeck's <a href="https://ygoprodeck.com/api-guide/" target="_blank" rel="noreferrer">public API</a>, but I do not affiliate with YGOPRODeck.</li>
            <li>I holds no liability for cards used in this app, including picture, card text and any product that related to it.</li>
        </ul>
    </CreditContainer>;
};