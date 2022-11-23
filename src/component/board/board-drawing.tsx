import React from 'react';
import styled from 'styled-components';

const BoardContainer = styled.div`
    
`;
const FieldContainer = styled.div`
    display: flex;
    .field-col {
        flex: 1;
    }
    .main-col {
        flex: 0 0 auto;
        background-color: var(--main-contrast);
        border: var(--bd-contrast);
        column-gap: 1px;
        display: inline-flex;
        flex-wrap: wrap;
        row-gap: 1px;
        width: calc(var(--card-height-sm) * 5 + 1px * 4 + 1px * 2);
        .zone {
            width: var(--card-height-sm);
            height: var(--card-height-sm);
            background-color: var(--main-secondaryLighter);
        }
    }
    .banish-gy-col {
        flex: 1;
    }
`;
const FieldDrawing = (props: React.HTMLAttributes<HTMLDivElement>) => {
    return <FieldContainer {...props}>
        <div className="field-col">
            <div></div>
        </div>
        <div className="main-col">
            <div className="zone"></div>
            <div className="zone"></div>
            <div className="zone"></div>
            <div className="zone"></div>
            <div className="zone"></div>
            <div className="zone"></div>
            <div className="zone"></div>
            <div className="zone"></div>
            <div className="zone"></div>
            <div className="zone"></div>
        </div>
        <div className="banish-gy-col">
            <div></div>
        </div>
    </FieldContainer>;
};
export const BoardDrawing = () => {
    return <BoardContainer>
        <FieldDrawing className="opponent-field" />
        <FieldDrawing className="your-field" />
    </BoardContainer>;
};