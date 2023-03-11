import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DOMEntityType, GetBoardRegex, GetDeckButtonRegex, MODAL_WRAPPER_ID, PropDOMEntityVisible } from 'src/model';
import { isLieInside, mergeClass } from 'src/util';
import Moveable from 'react-moveable';
import { ExtractProps } from 'src/type';
import { Card } from './card';
import { useBoardStore, useDeckStore, useDOMEntityStateStore, useZIndexState, ZIndexInstanceConverter } from 'src/state';
import { createPortal } from 'react-dom';
import './movable-card.scss';

export type MovableCard = {
    uniqueId: string,
    initialX?: number,
    initialY?: number,
    originEntity?: DOMEntityType,
    onDragToBoard?: (id: string, newCoor: { top: number, left: number }, origin: string, boardName: string) => void,
} & Card & React.HTMLAttributes<HTMLDivElement>;
export const MovableCard = ({
    uniqueId,
    image,
    size = 'sm',
    initialX = 0,
    initialY = 0,
    className,
    origin,
    originEntity,
    style,
    onDragToBoard,
    ...rest
}: MovableCard) => {
    const { addToDeck, deleteFromDeck } = useDeckStore(
        state => ({
            addToDeck: state.add,
            deleteFromDeck: state.delete,
        }),
        () => true,
    );
    const removeFromBoard = useBoardStore(state => state.delete);

    const {
        zIndexInstance,
        focus,
    } = useZIndexState(
        state => ({
            zIndexInstance: state.categoryMap['card'].queueMap.get(uniqueId, ZIndexInstanceConverter()),
            focus: state.toTop,
        }),
        (prev, next) => {
            return prev.zIndexInstance.get('name') === next.zIndexInstance.get('name')
                && prev.zIndexInstance.get('zIndex') === next.zIndexInstance.get('zIndex');
        },
    );
    const zIndex = zIndexInstance.get('zIndex');

    const [target, setTarget] = useState<HTMLDivElement | null>(null);
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
            highlightBeacon = ({ clientX, clientY }: MouseEvent) => {
                const DOMEntityList = useDOMEntityStateStore.getState().DOMEntityList;
                let foundWrapper = false;
                for (const DOMEntity of DOMEntityList) {
                    const { type, element, beaconList } = DOMEntity;
                    const DOMElement = element();
                    DOMElement.classList.remove('js-available-to-drop');

                    if (foundWrapper) continue;
                    if (!isLieInside({ x: clientX, y: clientY }, DOMEntity)) continue;
                    if (type === DOMEntityType['deckButton']
                        || (type === DOMEntityType['deckModal'] && DOMElement.getAttribute(PropDOMEntityVisible) === 'true')) {
                        foundWrapper = true;
                        let foundBeacon = false;
                        for (const beacon of beaconList) {
                            beacon.beaconElement().classList.remove('js-ready-to-drop');
                            if (foundBeacon === false && isLieInside({ x: clientX, y: clientY }, beacon)) {
                                foundBeacon = true;
                                beacon.beaconElement().classList.add('js-ready-to-drop');
                            }
                        }
                        DOMElement.classList.add('js-available-to-drop');
                    }
                }
            };
            document.addEventListener('mousemove', highlightBeacon);
        };
        const onMouseUp = ({ clientX, clientY }: MouseEvent) => {
            document.removeEventListener('mousemove', highlightBeacon);
            const { top = initialY, left = initialX } = target?.getBoundingClientRect() ?? {};
            const movedDistance = Math.sqrt((initialY - top) ** 2 + (initialX - left) ** 2);
            const DOMEntityList = useDOMEntityStateStore.getState().DOMEntityList;
            let foundValidDrop = false;
            for (const DOMEntity of DOMEntityList) {
                const { type, element, beaconList, name } = DOMEntity;
                const DOMElement = element();
                DOMElement.classList.remove('js-available-to-drop');

                if (foundValidDrop) continue;
                if (!isLieInside({ x: clientX, y: clientY }, DOMEntity)) continue;
                if (type === DOMEntityType['deckButton']
                    || (type === DOMEntityType['deckModal'] && DOMElement.getAttribute(PropDOMEntityVisible) === 'true')
                ) {
                    foundValidDrop = true;
                    let foundValidBeacon = false;
                    for (const beacon of beaconList) {
                        const { id, type, beaconElement } = beacon;

                        /**
                         * Nếu vị trí thả card nằm bên trong một beacon nào đó
                         */
                        if (foundValidBeacon === false && isLieInside({ x: clientX, y: clientY }, beacon)) {
                            const boardId = GetBoardRegex.exec(uniqueId)?.[1];
                            const deckButtonId = GetDeckButtonRegex.exec(uniqueId)?.[1];
                            if (type && id) {
                                if (boardId) {
                                    addToDeck(id, [image], type);
                                    removeFromBoard(boardId, [image.get('_id')]);
                                    foundValidBeacon = true;
                                } else if (deckButtonId && name !== deckButtonId) {
                                    addToDeck(id, [image], type);
                                    deleteFromDeck(deckButtonId, [image.get('_id')]);
                                    foundValidBeacon = true;
                                }
                            }
                        }
                        beaconElement().classList.remove('js-ready-to-drop');
                    }
                    continue;
                }
                if (type === DOMEntityType['board'] && originEntity === DOMEntityType['deckButton'] && movedDistance > 50) {
                    const boardName = DOMElement.getAttribute('data-board-name');

                    /** Ta không thực hiện thao tác drag vào board ở đây vì MovableCard không có thông tin về Deck mà nó thuộc về */
                    if (boardName) onDragToBoard?.(uniqueId, { top, left }, origin, boardName);
                }
            }
        };
        if (target && once.current === false) {
            once.current = true;
            target.style.left = `${initialX}px`;
            target.style.top = `${initialY}px`;
            if (originEntity === DOMEntityType['board']) focus('card', uniqueId);
        }
        if (target) {
            target.addEventListener('mousedown', onMouseDown);
            target.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', highlightBeacon);
            if (target) {
                target.removeEventListener('mousedown', onMouseDown);
                target.removeEventListener('mouseup', onMouseUp);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);

    const portal = document.getElementById(MODAL_WRAPPER_ID);

    if (!portal) return null;

    const ableTarget: HTMLElement | null = document.querySelector(`[data-moveable-card-id="${uniqueId}"`);
    return createPortal(
        <div
            ref={targetRef => setTarget(targetRef)}
            data-moveable-card-id={uniqueId}
            className={mergeClass('ygo-card', 'ygo-movable-card', `ygo-card-size-${size}`, className)}
            {...rest}
            style={{ zIndex, ...style }}
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
                }}
                onDrag={onDrag}
                onDragEnd={() => {
                    target!.style.zIndex = `${zIndex}`;
                    target!.classList.remove('card-is-dragging');
                }}
            />}
        </div>,
        portal,
    );
};