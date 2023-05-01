import styled from 'styled-components';

const AttributeTextContainer = styled.div`
    display: inline-block;
    width: 60px;
    font-weight: bold;
`;
export type AttributeText = {
    attribute?: string,
}
export const AttributeText = ({
    attribute,
}: AttributeText) => {
    let color = '#aaaaaa';
    switch (attribute) {
    case 'LIGHT': color = '#ddaa00'; break;
    case 'DARK': color = '#cc00ff'; break;
    case 'EARTH': color = '#ee6600'; break;
    case 'WIND': color = '#00bb00'; break;
    case 'WATER': color = '#00aaff'; break;
    case 'FIRE': color = '#dd0000'; break;
    case 'DIVINE': color = '#ffffff'; break;
    }

    return <AttributeTextContainer className="attribute-text" style={{ color }}>
        {attribute?.toUpperCase()}
    </AttributeTextContainer>;
};