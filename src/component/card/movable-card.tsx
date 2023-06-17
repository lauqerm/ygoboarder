import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    CLASS_CARD_MOVABLE,
    DOMEntityType,
    GetBoardRegex,
    GetDeckButtonRegex,
    MODAL_WRAPPER_ID,
    PROP_BOARD_NAME,
    PhaseType,
    Position,
    PropDOMEntityVisible,
} from 'src/model';
import { getAbsoluteRect, isLieInside, mergeClass } from 'src/util';
import Moveable from 'react-moveable';
import { ExtractProps } from 'src/type';
import { Card } from './card';
import { DOMEntity, useBoardState, useDeckState, useDOMEntityState, useZIndexState, ZIndexInstanceConverter } from 'src/state';
import { createPortal } from 'react-dom';
import './movable-card.scss';

export type MovableCard = {
    uniqueId: string,
    initialX?: number,
    initialY?: number,
    offsetX?: number,
    offsetY?: number,
    phase?: PhaseType,
    position?: Position,
    movableBoundary?: DOMEntity,
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
    offsetX = 0,
    offsetY = 0,
    phase,
    position,
    className,
    origin,
    originEntity,
    style,
    movableBoundary,
    onDragToBoard,
    ...rest
}: MovableCard) => {
    const [isReversed, setReversed] = useState((originEntity === 'board' && baseCard.get('preset') === 'opp') ? true : false);
    const { addToDeck, deleteFromDeck } = useDeckState(
        state => ({
            addToDeck: state.add,
            deleteFromDeck: state.delete,
        }),
        () => true,
    );
    const { changePhase, changePosition, removeFromBoard } = useBoardState(
        state => ({
            removeFromBoard: state.delete,
            changePosition: state.changePosition,
            changePhase: state.changePhase,
        }),
        () => true,
    );

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

    useEffect(() => {
        try {
            if (target) {
                const left = parseInt(target.style.left ?? '');
                const top = parseInt(target.style.top ?? '');
                if (!isNaN(left)) target.style.left = `${left + offsetX}px`;
                if (!isNaN(top)) target.style.top = `${top + offsetY}px`;
            }
        } catch (e) { }
    }, [offsetX, offsetY, target]);

    const once = useRef(false);
    useEffect(() => {
        let highlightBeacon = (_e: MouseEvent) => { };
        let currentX = initialX;
        let currentY = initialY;
        const onPointerDown = ({ clientX, clientY, button, target: eventTarget, pointerId }: PointerEvent) => {
            if (eventTarget) (eventTarget as HTMLDivElement).setPointerCapture(pointerId);
            if (button !== 0) return;
            currentX = clientX;
            currentY = clientY;
            focus('card', uniqueId);
            highlightBeacon = ({ clientX, clientY }: MouseEvent) => {
                const DOMEntityList = useDOMEntityState.getState().DOMEntityList;
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
        const onPointerUp = ({ clientX, clientY, button, target: eventTarget, pointerId }: PointerEvent) => {
            /** Capture và release pointer cho phép event trigger ngay cả khi chuột được release bên ngoài component ban đầu */
            if (eventTarget) (eventTarget as HTMLDivElement).releasePointerCapture(pointerId);
            document.removeEventListener('mousemove', highlightBeacon);
            /** Bỏ qua right click */
            if (button !== 0) return;
            const DOMEntityList = useDOMEntityState.getState().DOMEntityList;
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

            /** Drop tại beacon để cho card vào deck khác */
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

                    /** Ta không thực hiện thao tác drag vào board ở đây vì MovableCard không có thông tin về Deck mà nó thuộc về.
                     * Ta phải drop vào tọa độ tuyệt đối vì con trỏ chuột đang phụ thuộc vào viewport
                     */
                    if (boardName && target) onDragToBoard?.(uniqueId, getAbsoluteRect(target.getBoundingClientRect()), origin, boardName);
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
            target.addEventListener('pointerdown', onPointerDown);
            target.addEventListener('pointerup', onPointerUp);
        }

        return () => {
            document.removeEventListener('mousemove', highlightBeacon);
            if (target) {
                target.removeEventListener('pointerdown', onPointerDown);
                target.removeEventListener('pointerup', onPointerUp);
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
                isReversed ? 'ygo-card-reversed' : '',
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
                    if (boardId && originEntity === 'board' && position && target) {
                        if (e.ctrlKey) {
                            /** Xoay ngược card, chưa biết có cần lưu thông tin này ở dạng global không */
                            setReversed(cur => !cur);
                        } else {
                            /** Xoay card theo chiều ngang */
                            /** Ta tính toán lại vị trí để đảm bảo card xoay quanh tâm */
                            try {
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
                            } catch (e) {
                                console.error('MovableCard: Missing coordinate or variable', e);
                            }
                            changePosition(boardId, [{ id: baseCard.get('_id') }]);
                        }
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

                /** snappable */
                snappable={true}
                bounds={movableBoundary
                    ? {
                        top: 0,
                        left: 0,
                        bottom: movableBoundary.bottom - movableBoundary.top,
                        right: movableBoundary.right - movableBoundary.left,
                    }
                    : null}
                snapContainer={document.querySelector(`[${PROP_BOARD_NAME}="${movableBoundary?.name}"]`) as HTMLDivElement}
            />}
        </div>,
        portal,
    );
};