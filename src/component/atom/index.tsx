import { LimitStatus } from 'src/model';
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

const RestrictionTextContainer = styled.div`
    display: inline-block;
    font-weight: bold;
    font-family: 'Courier New', Courier, monospace;
    padding: 0 var(--spacing-sm);
    line-height: 1.2;
`;
export type RestrictionText = {
    limit?: LimitStatus,
}
export const RestrictionText = ({
    limit,
}: RestrictionText) => {
    let color = '';
    let background = '';
    let text = 3;
    switch (limit) {
    case 'Banned': color = '#ffffff'; background = '#ff0000'; text = 0; break;
    case 'Limited': color = '#ffffff'; background = '#ee6600'; text = 1; break;
    case 'Semi-Limited': color = '#333333'; background = '#eeaa00'; text = 2; break;
    }

    if (!limit || limit === 'Unlimited') return null;
    return <RestrictionTextContainer className="restriction-text" style={{ color, background }}>
        {text}
    </RestrictionTextContainer>;
};