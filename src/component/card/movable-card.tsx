import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    CLASS_CARD_MOVABLE,
    DOMEntityType,
    GetBoardRegex,
    GetDeckButtonRegex,
    MODAL_WRAPPER_ID,
    PhaseType,
    Position,
    PropDOMEntityVisible,
} from 'src/model';
import { isLieInside, mergeClass } from 'src/util';
import Moveable from 'react-moveable';
import { ExtractProps } from 'src/type';
import { Card } from './card';
import { useBoardStore, useDeckStore, useDOMEntityStateStore, usePreviewStore, useZIndexState, ZIndexInstanceConverter } from 'src/state';
import { createPortal } from 'react-dom';
import './movable-card.scss';

export type MovableCard = {
    uniqueId: string,
    initialX?: number,
    initialY?: number,
    phase?: PhaseType,
    position?: Position,
    originEntity?: DOMEntityType,
    onDragToBoard?: (id: string, newCoor: { top: number, left: number }, origin: string, boardName: string) => void,
} & Card & React.HTMLAttributes<HTMLDivElement>;
export const MovableCard = ({
    uniqueId,
    fake,
    baseCard,
    size = 'sm',
    initialX = 0,
    initialY = 0,
    phase,
    position,
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
    const { changePhase, changePosition, removeFromBoard } = useBoardStore(
        state => ({
            removeFromBoard: state.delete,
            changePosition: state.changePosition,
            changePhase: state.changePhase,
        }),
        () => true,
    );
    const preview = usePreviewStore(state => state.setCardPreview);

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
        let currentX = initialX;
        let currentY = initialY;
        const onMouseDown = ({ clientX, clientY, button }: MouseEvent) => {
            if (button !== 0) return;
            currentX = clientX;
            currentY = clientY;
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
                        || (type === DOMEntityType['deckModal'] && DOMElement.getAttribute(PropDOMEntityVisible) === 'true')
                    ) {
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
        const onMouseUp = ({ clientX, clientY, button }: MouseEvent) => {
            document.removeEventListener('mousemove', highlightBeacon);
            /** Bỏ qua right click */
            if (button !== 0) return;
            const DOMEntityList = useDOMEntityStateStore.getState().DOMEntityList;
            /** Left click một lần để đổi trạng thái faceup-facedown */
            const movedDistance = Math.sqrt((currentY - clientY) ** 2 + (currentX - clientX) ** 2);
            const boardId = GetBoardRegex.exec(uniqueId)?.[1];
            if (movedDistance <= 5 && boardId) {
                if (originEntity === 'board' && phase) {
                    changePhase(boardId, [{ id: baseCard.get('_id') }]);
                }
                for (const DOMEntity of DOMEntityList) {
                    const { element, beaconList } = DOMEntity;
                    element().classList.remove('js-available-to-drop');

                    for (const beacon of beaconList) beacon.beaconElement().classList.remove('js-ready-to-drop');
                }
                return;
            }

            const { top = initialY, left = initialX } = target?.getBoundingClientRect() ?? {};
            const movedInitialDistance = Math.sqrt((initialY - top) ** 2 + (initialX - left) ** 2);
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
                            const deckButtonId = GetDeckButtonRegex.exec(uniqueId)?.[1];
                            if (type && id) {
                                if (boardId) {
                                    addToDeck(id, [{ card: baseCard, phase }], type);
                                    removeFromBoard(boardId, [baseCard.get('_id')]);
                                    foundValidBeacon = true;
                                } else if (deckButtonId && name !== deckButtonId) {
                                    addToDeck(id, [{ card: baseCard, phase }], type);
                                    deleteFromDeck(deckButtonId, [baseCard.get('_id')]);
                                    foundValidBeacon = true;
                                }
                            }
                        }
                        beaconElement().classList.remove('js-ready-to-drop');
                    }
                    continue;
                }
                /** Drag từ topdeck ra board, nếu cự ly drag nhỏ hơn 20 thì ta không làm gì vì đây có thể là misclick */
                if (type === DOMEntityType['board'] && originEntity === DOMEntityType['deckButton'] && movedInitialDistance > 20) {
                    const boardName = DOMElement.getAttribute('data-board-name');

                    /** Ta không thực hiện thao tác drag vào board ở đây vì MovableCard không có thông tin về Deck mà nó thuộc về */
                    if (boardName) onDragToBoard?.(uniqueId, { top, left }, origin, boardName);
                }
            }
        };
        const openPreview = () => {
            if (baseCard.get('type') === 'external') {
                preview('external', baseCard.get('dataURL'), baseCard.get('description'));
            } else {
                preview('internal', baseCard.get('data'), baseCard.get('description'));
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
            target.addEventListener('mouseenter', openPreview);
        }

        return () => {
            document.removeEventListener('mousemove', highlightBeacon);
            if (target) {
                target.removeEventListener('mousedown', onMouseDown);
                target.removeEventListener('mouseup', onMouseUp);
                target.removeEventListener('mouseenter', openPreview);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);

    const portal = document.getElementById(MODAL_WRAPPER_ID);

    if (!portal) return null;
    return createPortal(
        <div
            ref={targetRef => setTarget(targetRef)}
            data-moveable-card-id={uniqueId}
            data-moveable-card-origin-entity={originEntity}
            className={mergeClass(
                'ygo-card',
                'ygo-movable-card',
                CLASS_CARD_MOVABLE,
                `ygo-card-size-${size}`,
                `ygo-card-phase-${phase}`,
                `ygo-card-position-${position}`,
                className,
            )}
            {...rest}
            style={{ zIndex, ...style }}
        >
            <Card
                baseCard={baseCard}
                origin={origin}
                fake={fake}
                flashing={true}
                phase={phase}
                position={position}
                onContextMenu={e => {
                    e.preventDefault();
                    const boardId = GetBoardRegex.exec(uniqueId)?.[1];
                    if (boardId && originEntity === 'board' && position) {
                        /** Ta tính toán lại vị trí để đảm bảo card xoay quanh tâm */
                        try {
                            if (target) {
                                const computedStyle = getComputedStyle(target);
                                const cardWidth = parseInt(computedStyle.getPropertyValue('--card-width').replace('px', ''));
                                const cardHeight = parseInt(computedStyle.getPropertyValue('--card-height').replace('px', ''));
                                const currentX = parseInt(target.style.left.replace('px', ''));
                                const currentY = parseInt(target.style.top.replace('px', ''));

                                if (position === 'atk') {
                                    target.style.left = `${currentX - (cardHeight - cardWidth) / 2}px`;
                                    target.style.top = `${currentY + (cardHeight - cardWidth) / 2}px`;
                                } else {
                                    target.style.left = `${currentX + (cardHeight - cardWidth) / 2}px`;
                                    target.style.top = `${currentY - (cardHeight - cardWidth) / 2}px`;
                                }
                            }
                        } catch (e) {
                            console.error('MovableCard: Missing coordinate or variable', e);
                        }
                        changePosition(boardId, [{ id: baseCard.get('_id') }]);
                    }
                }}
            />
            {target && <Moveable
                target={target}
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