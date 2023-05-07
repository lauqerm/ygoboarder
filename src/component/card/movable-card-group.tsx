import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    CLASS_CARD_MOVABLE,
    CLASS_CARD_MOVABLE_ZONED,
    CardImageConverter,
    CardSize,
    DOMEntityType,
    GetBoardRegex,
    GetDropIDRegex,
    MODAL_WRAPPER_ID,
    PropDOMEntityVisible,
} from 'src/model';
import { isLieInside, mergeClass } from 'src/util';
import Moveable from 'react-moveable';
import { ExtractProps } from 'src/type';
import { BoardCard, BoardEntryConverter, useBoardStore, useCardGroupStore, useDeckStore, useDOMEntityStateStore, useZIndexState } from 'src/state';
import { createPortal } from 'react-dom';
import { List } from 'immutable';
import './movable-card-group.scss';

export type MovableCardGroup = {
    groupName: string,
    count: number,
    initialX?: number,
    initialY?: number,
    originEntity?: DOMEntityType,
} & React.HTMLAttributes<HTMLDivElement>;
export const MovableCardGroup = ({
    groupName,
    count,
    initialX = 0,
    initialY = 0,
    className,
    originEntity,
    style,
    ...rest
}: MovableCardGroup) => {
    const fullIdList = useRef<string[]>([]);
    const cardIdList = useRef<string[]>([]);
    const target = useRef<HTMLDivElement>(null);
    const [key, setKey] = useState(0);
    const cardGroupElementList = useCardGroupStore(state => state.elementGroup[groupName]);
    const addToDeck = useDeckStore(state => state.add);
    const removeFromBoard = useBoardStore(state => state.delete);

    const focus = useZIndexState(
        state => state.toTop,
    );

    const onDragGroup = useCallback(({
        events,
    }: Parameters<NonNullable<ExtractProps<typeof Moveable>['onDragGroup']>>[0]) => {
        events.forEach(ev => {
            const { target, left, top, transform } = ev;
            target!.style.left = `${left}px`;
            target!.style.top = `${top}px`;
            target!.style.transform = transform;
        });
    }, []);

    const [showLabel, setShowLabel] = useState(false);
    const once = useRef(false);
    const highlightBeacon = useRef((_e: MouseEvent) => { });
    useEffect(() => {
        const currentTarget = target.current;
        fullIdList.current = (cardGroupElementList ?? [])
            .map(cardElement => cardElement.getAttribute('data-moveable-card-id'))
            .filter(entry => entry && entry.length > 0) as string[];
        cardIdList.current = fullIdList.current
            .map(id => GetDropIDRegex.exec(id)?.[1])
            .filter(Boolean) as string[];

        const onMouseDown = ({ button }: MouseEvent) => {
            if (button !== 0) return;
            cardIdList.current.forEach(cardId => focus('card', cardId));
            highlightBeacon.current = ({ clientX, clientY }: MouseEvent) => {
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
            document.addEventListener('mousemove', highlightBeacon.current);
        };
        const onMouseUp = ({ clientX, clientY }: MouseEvent) => {
            document.removeEventListener('mousemove', highlightBeacon.current);
            const DOMEntityList = useDOMEntityStateStore.getState().DOMEntityList;
            let foundValidDrop = false;
            for (const DOMEntity of DOMEntityList) {
                const { type, element, beaconList } = DOMEntity;
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
                            /** Lấy phần tử đầu tiên trong list làm uniqueId của cả group */
                            const uniqueId = fullIdList.current[0];
                            const boardId = GetBoardRegex.exec(uniqueId)?.[1];
                            const cardIdInGroupSet = new Set(cardIdList.current);
                            if (type && id && boardId) {
                                const cardImageList = useBoardStore
                                    .getState().boardMap
                                    .get(boardId, BoardEntryConverter())
                                    .get('boardCardList', List<BoardCard>())
                                    .filter(entry => cardIdInGroupSet.has(entry.get('card', CardImageConverter()).get('_id', '')))
                                    .map(entry => entry.get('card'))
                                    .toArray();

                                addToDeck(id, cardImageList, type);
                                removeFromBoard(boardId, cardImageList.map(entry => entry.get('_id')));
                                foundValidBeacon = true;
                            }
                        }
                        beaconElement().classList.remove('js-ready-to-drop');
                    }
                    continue;
                }
            }
        };
        if (once.current === false) {
            once.current = true;
            setShowLabel(true);
        }
        if (currentTarget) {
            currentTarget.addEventListener('mousedown', onMouseDown);
            currentTarget.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', highlightBeacon.current);
            if (currentTarget) {
                currentTarget.removeEventListener('mousedown', onMouseDown);
                currentTarget.removeEventListener('mouseup', onMouseUp);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cardGroupElementList]);

    const portal = document.getElementById(MODAL_WRAPPER_ID);

    if (!portal) return null;

    return createPortal(
        <div ref={target}
            className={mergeClass('ygo-card-group', 'ygo-movable-card-group', 'js-ygo-movable-card-group', groupName, className)}
            onContextMenu={e => {
                e.preventDefault();
                const { clientX, clientY } = e;
                /** Right click một lần để gom lại theo chiều ngang */
                const offsetBetweenCard = 8;
                const groupWidth = (cardGroupElementList.length - 1) * offsetBetweenCard + CardSize.sm.width;

                cardGroupElementList.forEach((element, index) => {
                    element.style.top = `${clientY - 40}px`;
                    element.style.left = `${clientX - (groupWidth / 2) + offsetBetweenCard * index}px`;
                });
                /** Set key để force reset bound */
                setKey(cnt => cnt + 1);
            }}
            {...rest}
        // style={{ zIndex, ...style }}
        >
            {showLabel && <MovableCardGroupLabel key={`movable-label-${key}`} count={count} />}
            {<Moveable key={`movable-${key}`}
                // targetGroups={cardGroupElementList}
                target={`.${CLASS_CARD_MOVABLE}.${CLASS_CARD_MOVABLE_ZONED}`}
                container={null}

                /* Resize event edges */
                edge={false}

                /* draggable */
                draggable={true}
                throttleDrag={0}
                onClickGroup={e => {
                    const { clientX, clientY } = e;
                    /** Left click một lần để dàn ra theo chiều ngang */
                    const groupWidth = Math.min(Math.max(0, cardGroupElementList.length * 90), 600);
                    const offsetBetweenCard = cardGroupElementList.length <= 1
                        ? 0
                        : (groupWidth - CardSize.sm.width) / (cardGroupElementList.length - 1);

                    cardGroupElementList.forEach((element, index) => {
                        element.style.top = `${clientY - 40}px`;
                        element.style.left = `${clientX - (groupWidth / 2) + offsetBetweenCard * index}px`;
                    });
                    const DOMEntityList = useDOMEntityStateStore.getState().DOMEntityList;
                    for (const DOMEntity of DOMEntityList) {
                        const { element, beaconList } = DOMEntity;
                        element().classList.remove('js-available-to-drop');
    
                        for (const beacon of beaconList) beacon.beaconElement().classList.remove('js-ready-to-drop');
                    }
                    document.removeEventListener('mousemove', highlightBeacon.current);
                }}
                onDragGroup={onDragGroup}
                onDragGroupStart={e => {
                    document.querySelector(`.js-ygo-movable-card-group.${groupName}`)?.classList.add('is-dragging');
                    e.events.forEach(entry => {
                        entry.target!.classList.add('belong-to-dragging-group');
                    });
                }}
                onDragGroupEnd={e => {
                    document.querySelector(`.js-ygo-movable-card-group.${groupName}`)?.classList.remove('is-dragging');
                    e.events.forEach(entry => {
                        entry.target!.classList.remove('belong-to-dragging-group');
                    });
                }}
            />}
        </div>,
        portal,
    );
};

type MovableCardGroupLabel = {
    count: number,
} & React.HTMLAttributes<HTMLDivElement>;
const MovableCardGroupLabel = ({
    count,
    ...rest
}: MovableCardGroupLabel) => {
    const portal = document.querySelector('.ygo-card-group.ygo-movable-card-group .moveable-control-box');

    if (!portal) return null;
    return createPortal(
        <div {...rest} className="ygo-movable-card-group-label">
            {count} cards
        </div>,
        portal,
    );
};