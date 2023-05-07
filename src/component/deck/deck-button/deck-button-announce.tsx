import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { mergeClass } from 'src/util';
import styled from 'styled-components';

const DeckButtonAnncounterContainer = styled.div`
    background-color: var(--main-info);
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    text-align: center;
    line-height: normal;
    font-size: var(--fs-xs);
    box-shadow: 0 0 1px 2px var(--sub-info);
    transition: all ease 0.5s;
    pointer-events: none;
    &.hide {
        opacity: 0;
    }
    &:empty {
        display: none;
    }
`;
export type DeckButtonAnnouncerRef = {
    trigger: (value: string) => void,
}
export type DeckButtonAnnouncer = {};
export const DeckButtonAnnouncer = forwardRef<DeckButtonAnnouncerRef, DeckButtonAnnouncer>((_, ref) => {
    const [value, setValue] = useState('');
    const [show, setShow] = useState(false);

    useEffect(() => {
        let relevant = true;
        if (show) setTimeout(() => {
            if (relevant) setShow(false);
        }, 3000);

        return () => {
            relevant = false;
        };
    }, [show]);

    useImperativeHandle(ref, () => ({
        trigger: value => {
            setValue(value);
            setShow(true);
        },
    }));

    return <DeckButtonAnncounterContainer className={mergeClass('deck-button-announcer', show ? 'show' : 'hide')}>
        {value}
    </DeckButtonAnncounterContainer>;
});