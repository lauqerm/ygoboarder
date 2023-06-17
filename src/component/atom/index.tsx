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
    let textShadow = '';
    switch (attribute) {
    case 'LIGHT': color = '#ddaa00'; break;
    case 'DARK': color = '#cc00ff'; break;
    case 'EARTH': color = '#ee6600'; break;
    case 'WIND': color = '#00bb00'; break;
    case 'WATER': color = '#00aaff'; break;
    case 'FIRE': color = '#dd0000'; break;
    case 'DIVINE': color = '#eebb00'; break;
    }

    return <AttributeTextContainer className="attribute-text" style={{ color, textShadow }}>
        {attribute?.toUpperCase()}
    </AttributeTextContainer>;
};

const RestrictionTextContainer = styled.div`
    display: inline-flex;
    font-size: 13px;
    overflow: hidden;
    .prefix {
        background-color: var(--contrast-antd);
        padding: 0 var(--spacing-xs);
    }
    .restriction-row {
        padding: 0 var(--spacing-sm);
    }
    .prefix:empty,
    &:empty {
        display: none;
    }
`;
export type RestrictionText = {
    prefix?: React.ReactNode,
    limitList?: { format: string, limit?: LimitStatus }[],
}
export const RestrictionText = ({
    prefix,
    limitList,
}: RestrictionText) => {
    return <RestrictionTextContainer className="restriction-text">
        {prefix && <div className="prefix">{prefix}</div>}
        {limitList?.map(({ format, limit }, _, arr) => {
            let color = '';
            let background = '';
            let text = 3;
            switch (limit) {
            case 'Banned': color = '#ffffff'; background = '#ff0000'; text = 0; break;
            case 'Limited': color = '#ffffff'; background = '#ee6600'; text = 1; break;
            case 'Semi-Limited': color = '#333333'; background = '#eeaa00'; text = 2; break;
            }

            if (!limit || limit === 'Unlimited') return null;
            return <div key={format} className="restriction-row" style={{ color, background }}>
                {`${arr.length <= 1 ? '' : format.toUpperCase()} ${text}`.trim()}
            </div>;
        })}
    </RestrictionTextContainer>;
};

export * from './board-atom';
export * from './board-icon';
export * from './card-back';
export * from './checkbox-group';
export * from './counter-list';
export * from './credit';
export * from './marker-picker';
export * from './player-tag';
export * from './select-group';