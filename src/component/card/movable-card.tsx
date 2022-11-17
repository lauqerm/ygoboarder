import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BEACON_ACTION, CardImage, DeckType, DROP_TYPE_DECK, DROP_TYPE_DECK_BEACON, GetBoardRegex, GetDropActionRegex, GetDropIDRegex, GetOriginRegex } from 'src/model';
import { mergeClass } from 'src/util';
import Moveable from 'react-moveable';
import { ExtractProps } from 'src/type';
import { Card } from './card';
import './movable-card.scss';
import { useBoardStore, useDeckStore } from 'src/state';
import debounce from 'lodash.debounce';

export type MovableCard = {
    uniqueId: string,
    initialX?: number,
    initialY?: number,
} & Card & React.HTMLAttributes<HTMLDivElement>;
export const MovableCard = ({
    uniqueId,
    image,
    size = 'sm',
    initialX = 0,
    initialY = 0,
    className,
    origin,
    ...rest
}: MovableCard) => {
    const addToDeck = useDeckStore(state => state.add);
    const removeFromBoard = useBoardStore(state => state.delete);
    const [target, setTarget] = useState<HTMLDivElement | null>(null);

    const onDrag = useCallback(({
        target,
        left, top,
        transform,
    }: Parameters<NonNullable<ExtractProps<typeof Moveable>['onDrag']>>[0]) => {
        target!.style.left = `${left}px`;
        target!.style.top = `${top}px`;
        target!.style.transform = transform;
    }, []);

    const once = useRef(false);
    useEffect(() => {
        let beaconCoordination: {
            left: number,
            top: number,
            right: number,
            bottom: number,
            id: string,
            type: BEACON_ACTION,
            element: HTMLElement,
            zIndex: number,
        }[] = [];
        let highlightBeacon = (e: MouseEvent) => { };
        const onMouseDown = () => {
            if (target) target.style.zIndex = '1001';
            const beaconList = document.querySelectorAll<HTMLElement>(`[data-entity-type=${DROP_TYPE_DECK_BEACON}]`);
            beaconCoordination = [];

            for (let cnt = 0; cnt < beaconList.length; cnt++) {
                const element = beaconList[cnt];
                const { left, top, right, bottom } = element.getBoundingClientRect();
                const beaconInfo = element.getAttribute('data-deck-beacon');
                const beaconIndex = parseInt(element.getAttribute('data-beacon-index') ?? '');
                if (beaconInfo) {
                    const beaconType: BEACON_ACTION | undefined = GetDropActionRegex.exec(beaconInfo)?.[1] as BEACON_ACTION | undefined;
                    const deckId = GetDropIDRegex.exec(beaconInfo)?.[1];
                    if (deckId && beaconType && !isNaN(beaconIndex)) {
                        element.classList.add('available-to-drop');
                        beaconCoordination.push({
                            left,
                            top,
                            right,
                            bottom,
                            id: deckId,
                            type: beaconType,
                            element,
                            zIndex: beaconIndex,
                        });
                    }
                }
            }
            beaconCoordination = beaconCoordination.sort((l, r) => r.zIndex - l.zIndex);
            highlightBeacon = debounce((e: MouseEvent) => {
                const { clientX, clientY } = e;
                let found = false;
                for (let cnt = 0; cnt < beaconCoordination.length; cnt++) {
                    const { left, top, right, bottom, element } = beaconCoordination[cnt];
                    if (found === false && (clientX >= left) && (clientX <= right) && (clientY >= top) && (clientY <= bottom)) {
                        found = true;
                        element.classList.add('ready-to-drop');
                    } else {
                        element.classList.remove('ready-to-drop');
                    }
                }
            }, 50);
            document.addEventListener('mousemove', highlightBeacon);
        };
        const onMouseUp = (e: MouseEvent) => {
            document.removeEventListener('mousemove', highlightBeacon);
            if (target) target.style.zIndex = '1';
            const { clientX, clientY } = e;

            let found = false;
            for (let cnt = 0; cnt < beaconCoordination.length; cnt++) {
                const { left, top, right, bottom, id, type, element } = beaconCoordination[cnt];

                /**
                 * Nếu vị trí thả card nằm bên trong một beacon nào đó
                 */
                if (found === false && (clientX >= left) && (clientX <= right) && (clientY >= top) && (clientY <= bottom)) {
                    const boardId = GetBoardRegex.exec(uniqueId)?.[1];
                    if (type && id && boardId) {
                        addToDeck(id, [image], type);
                        removeFromBoard(boardId, [image.get('_id')]);
                        found = true;
                    }
                }
                element.classList.remove('ready-to-drop', 'available-to-drop');
            }
        };
        if (target && once.current === false) {
            once.current = true;
            target.style.left = `${initialX}px`;
            target.style.top = `${initialY}px`;
        }
        if (target) {
            target.addEventListener('mousedown', onMouseDown);
            target.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            if (target) {
                target.removeEventListener('mousedown', onMouseDown);
                target.removeEventListener('mouseup', onMouseUp);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);

    const ableTarget: HTMLElement | null = document.querySelector(`[data-moveable-card-id="${uniqueId}"`);
    return <div
        ref={targetRef => setTarget(targetRef)}
        data-moveable-card-id={uniqueId}
        className={mergeClass('ygo-card', 'ygo-movable-card', `ygo-card-size-${size}`, className)}
        {...rest}
    >
        <Card image={image} origin={origin} />
        {ableTarget && <Moveable
            target={ableTarget}
            container={null}

            /* Resize event edges */
            edge={false}

            /* draggable */
            draggable={true}
            throttleDrag={0}
            onDrag={onDrag}
        />}
    </div>;
};