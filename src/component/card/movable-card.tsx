import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BeaconAction, DROP_TYPE_DECK_BEACON, DROP_TYPE_DECK_BEACON_LIST, GetBoardRegex, GetDropActionRegex, GetDropIDRegex } from 'src/model';
import { mergeClass } from 'src/util';
import Moveable from 'react-moveable';
import { ExtractProps } from 'src/type';
import { Card } from './card';
import { useBoardStore, useCardEventStore, useDeckStore, useDOMEntityStateStore, useZIndexState, ZIndexInstanceConverter } from 'src/state';
import './movable-card.scss';
import { createPortal } from 'react-dom';

export type MovableCard = {
    uniqueId: string,
    initialX?: number,
    initialY?: number,
    onStaticBreak?: (id: string, origin: string) => void,
} & Card & React.HTMLAttributes<HTMLDivElement>;
export const MovableCard = ({
    uniqueId,
    image,
    size = 'sm',
    initialX = 0,
    initialY = 0,
    className,
    origin,
    style,
    onStaticBreak,
    ...rest
}: MovableCard) => {
    const addToDeck = useDeckStore(state => state.add);
    const removeFromBoard = useBoardStore(state => state.delete);
    const beforeDragCoordination = useRef({
        top: undefined as number | undefined,
        left: undefined as number | undefined,
    });
    const [target, setTarget] = useState<HTMLDivElement | null>(null);
    const {
        cardInstance,
        focus,
    } = useZIndexState(
        state => ({
            cardInstance: state.categoryMap['card'].queueMap.get(uniqueId, ZIndexInstanceConverter()),
            focus: state.toTop,
        }),
        (prev, next) => {
            return prev.cardInstance.get('name') === next.cardInstance.get('name')
                && prev.cardInstance.get('zIndex') === next.cardInstance.get('zIndex');
        },
    );
    const {
        DOMEntityList,
        DOMEntityMap,
    } = useDOMEntityStateStore(
        ({ DOMEntityList, DOMEntityMap, recalculateCount }) => ({
            DOMEntityList: DOMEntityList,
            DOMEntityMap: DOMEntityMap,
            version: recalculateCount,
        }),
        (prev, next) => prev.version === next.version,
    );
    const onDrag = useCallback(({
        target,
        left, top,
        transform,
    }: Parameters<NonNullable<ExtractProps<typeof Moveable>['onDrag']>>[0]) => {
        target!.style.left = `${left}px`;
        target!.style.top = `${top}px`;
        target!.style.zIndex = '1000';
        target!.style.transform = transform;
    }, []);

    const once = useRef(false);
    useEffect(() => {
        let highlightBeacon = (_e: MouseEvent) => { };
        const onMouseDown = () => {
            focus('card', uniqueId);
            highlightBeacon = (e: MouseEvent) => {
                const { clientX, clientY } = e;
                let foundWrapper = false;
                for (let cnt = 0; cnt < DOMEntityList.length; cnt++) {
                    const { name, type } = DOMEntityList[cnt];
                    const { left, top, right, bottom, element, beaconList } = DOMEntityMap[type][name];
                    element.classList.remove('available-to-drop');
                    if (foundWrapper === false
                        && type === 'deckButton'
                        && (clientX >= left) && (clientX <= right) && (clientY >= top) && (clientY <= bottom)
                    ) {
                        foundWrapper = true;
                        let foundBeacon = false;
                        for (let innerCnt = 0; innerCnt < beaconList.length; innerCnt++) {
                            const { left, top, right, bottom, beaconElement } = beaconList[innerCnt];
                            beaconElement.classList.remove('ready-to-drop');
                            if (foundBeacon === false && (clientX >= left) && (clientX <= right) && (clientY >= top) && (clientY <= bottom)) {
                                console.log('🚀 ~ file: movable-card.tsx:104 ~ onMouseDown ~ type', beaconElement);
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
            const { clientX, clientY } = e;

            let found = false;
            for (let cnt = 0; cnt < DOMEntityList.length; cnt++) {
                const { name, type } = DOMEntityList[cnt];
                const { left, top, right, bottom, element, beaconList } = DOMEntityMap[type][name];

                /**
                 * Nếu vị trí thả card nằm bên trong một beacon wrapper nào đó
                 */
                if (found === false
                    && type === 'deckButton'
                    && (clientX >= left) && (clientX <= right) && (clientY >= top) && (clientY <= bottom)
                ) {
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
            console.log('🚀 ~ file: movable-card.tsx:27 ~ initialX', initialX, initialY);
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
    console.log('🚀 ~ file: movable-card.tsx:27 ~ initialX', initialX, initialY);

    if (!portal) return null;

    const ableTarget: HTMLElement | null = document.querySelector(`[data-moveable-card-id="${uniqueId}"`);
    return createPortal(
        <div
            ref={targetRef => setTarget(targetRef)}
            data-moveable-card-id={uniqueId}
            className={mergeClass('ygo-card', 'ygo-movable-card', `ygo-card-size-${size}`, className)}
            {...rest}
            style={{ zIndex: cardInstance.get('zIndex'), ...style }}
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
                onDragStart={() => {
                    target!.classList.add('card-is-dragging');
                    const { top, left } = target?.getBoundingClientRect() ?? {};
                    beforeDragCoordination.current = { top, left };
                }}
                onDrag={onDrag}
                onDragEnd={() => {
                    target!.style.zIndex = `${cardInstance.get('zIndex')}`;
                    target!.classList.remove('card-is-dragging');
                    const { top, left } = target?.getBoundingClientRect() ?? {};
                    const { top: anchorTop, left: anchorLeft } = beforeDragCoordination.current;
                    console.log('🚀 ~ file: movable-card.tsx:237', top, left, anchorTop, anchorLeft);

                    if (top != null && left != null && anchorTop != null && anchorLeft != null) {
                        const movedDistance = Math.sqrt((top - anchorTop)**2 + (left - anchorLeft)**2);

                        if (movedDistance > 50) onStaticBreak?.(uniqueId, origin);
                    }
                }}
            />}
        </div>,
        portal,
    );
};