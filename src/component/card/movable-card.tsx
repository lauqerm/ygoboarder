import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BEACON_ACTION, DROP_TYPE_DECK_BEACON, DROP_TYPE_DECK_BEACON_LIST, GetBoardRegex, GetDropActionRegex, GetDropIDRegex } from 'src/model';
import { mergeClass } from 'src/util';
import Moveable from 'react-moveable';
import { ExtractProps } from 'src/type';
import { Card } from './card';
import { useBoardStore, useCardEventStore, useDeckStore } from 'src/state';
import './movable-card.scss';
import { createPortal } from 'react-dom';

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
    const markAsIsDraggingBoardCard = useCardEventStore(state => state.setDraggingBoardCardStatus);
    const onDrag = useCallback(({
        target,
        left, top,
        transform,
    }: Parameters<NonNullable<ExtractProps<typeof Moveable>['onDrag']>>[0]) => {
        target!.style.left = `${left}px`;
        target!.style.top = `${top}px`;
        target!.style.transform = transform;
        target!.classList.add('card-is-dragging');
        markAsIsDraggingBoardCard(true);
    }, [markAsIsDraggingBoardCard]);

    const once = useRef(false);
    useEffect(() => {
        let beaconWrapperCoordination: {
            left: number,
            top: number,
            right: number,
            bottom: number,
            zIndex: number,
            element: HTMLElement,
            beaconList: {
                id: string,
                left: number,
                top: number,
                right: number,
                bottom: number,
                type: BEACON_ACTION,
                beaconElement: HTMLElement,
            }[]
        }[] = [];
        let highlightBeacon = (_e: MouseEvent) => { };
        const onMouseDown = () => {
            if (target) target.style.zIndex = '1001';
            const beaconWrapperList = document.querySelectorAll<HTMLElement>(`[data-entity-type=${DROP_TYPE_DECK_BEACON_LIST}][data-beacon-visibility=true]`);
            beaconWrapperCoordination = [];

            for (let cnt = 0; cnt < beaconWrapperList.length; cnt++) {
                const element = beaconWrapperList[cnt];
                const { left, top, right, bottom } = element.getBoundingClientRect();
                const beaconIndex = parseInt(element.getAttribute('data-beacon-index') ?? '');
                if (!isNaN(beaconIndex)) {
                    const newBeaconWrapperEntry: typeof beaconWrapperCoordination[0] = {
                        left, top, right, bottom,
                        element,
                        zIndex: beaconIndex,
                        beaconList: [],
                    };
                    const beaconList = element.querySelectorAll<HTMLElement>(`[data-entity-type=${DROP_TYPE_DECK_BEACON}]`);
                    for (let innerCnt = 0; innerCnt < beaconList.length; innerCnt++) {
                        const beaconElement = beaconList[innerCnt];
                        const beaconInfo = beaconElement.getAttribute('data-deck-beacon');

                        if (beaconInfo) {
                            const beaconType: BEACON_ACTION | undefined = GetDropActionRegex.exec(beaconInfo)?.[1] as BEACON_ACTION | undefined;
                            const deckId = GetDropIDRegex.exec(beaconInfo)?.[1];

                            if (deckId && beaconType) {
                                const { left, top, right, bottom } = beaconElement.getBoundingClientRect();
                                newBeaconWrapperEntry.beaconList.push({
                                    id: deckId,
                                    type: beaconType,
                                    left, top, right, bottom,
                                    beaconElement,
                                });
                            }
                        }
                    }
                    beaconWrapperCoordination.push(newBeaconWrapperEntry);
                }
            }

            beaconWrapperCoordination = beaconWrapperCoordination.sort((l, r) => r.zIndex - l.zIndex);
            highlightBeacon = (e: MouseEvent) => {
                const { clientX, clientY } = e;
                let foundWrapper = false;
                for (let cnt = 0; cnt < beaconWrapperCoordination.length; cnt++) {
                    const { left, top, right, bottom, element, beaconList } = beaconWrapperCoordination[cnt];
                    element.classList.remove('available-to-drop');
                    if (foundWrapper === false && (clientX >= left) && (clientX <= right) && (clientY >= top) && (clientY <= bottom)) {
                        foundWrapper = true;
                        let foundBeacon = false;
                        for (let innerCnt = 0; innerCnt < beaconList.length; innerCnt++) {
                            const { left, top, right, bottom, beaconElement } = beaconList[innerCnt];
                            beaconElement.classList.remove('ready-to-drop');
                            if (foundBeacon === false && (clientX >= left) && (clientX <= right) && (clientY >= top) && (clientY <= bottom)) {
                                foundBeacon = true;
                                beaconElement.classList.add('ready-to-drop');
                            }
                        }
                        element.classList.add('available-to-drop');
                    }
                }
            };
            document.addEventListener('mousemove', highlightBeacon);
        };
        const onMouseUp = (e: MouseEvent) => {
            document.removeEventListener('mousemove', highlightBeacon);
            markAsIsDraggingBoardCard(false);
            if (target) target.style.zIndex = '1';
            const { clientX, clientY } = e;

            let found = false;
            console.log('🚀 ~ file: movable-card.tsx ~ line 134 ~ onMouseUp ~ beaconWrapperCoordination', beaconWrapperCoordination);
            for (let cnt = 0; cnt < beaconWrapperCoordination.length; cnt++) {
                const { left, top, right, bottom, element, beaconList } = beaconWrapperCoordination[cnt];

                /**
                 * Nếu vị trí thả card nằm bên trong một beacon wrapper nào đó
                 */
                if (found === false && (clientX >= left) && (clientX <= right) && (clientY >= top) && (clientY <= bottom)) {
                    found = true;
                    let beaconFound = false;
                    for (let innerCnt = 0; innerCnt < beaconList.length; innerCnt++) {
                        const { left, top, right, bottom, id, type, beaconElement } = beaconList[innerCnt];

                        /**
                         * Nếu vị trí thả card nằm bên trong một beacon nào đó
                         */
                        if (beaconFound === false && (clientX >= left) && (clientX <= right) && (clientY >= top) && (clientY <= bottom)) {
                            const boardId = GetBoardRegex.exec(uniqueId)?.[1];
                            if (type && id && boardId) {
                                addToDeck(id, [image], type);
                                removeFromBoard(boardId, [image.get('_id')]);
                                beaconFound = true;
                            }
                        }
                        beaconElement.classList.remove('ready-to-drop');
                    }
                }
                element.classList.remove('available-to-drop');
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

    const portal = document.getElementById('modal-wrapper');

    if (!portal) return null;

    const ableTarget: HTMLElement | null = document.querySelector(`[data-moveable-card-id="${uniqueId}"`);
    return createPortal(
        <div
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
                onDragEnd={() => {
                    target!.classList.remove('card-is-dragging');
                    markAsIsDraggingBoardCard(false);
                }}
            />}
        </div>,
        portal,
    );
};