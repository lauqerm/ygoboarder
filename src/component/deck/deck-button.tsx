import { useRef, useState } from 'react';
import { DeckModal } from '.';
import { DeckBeacon, DeckBeaconWrapper } from './deck-beacon';
import { BeaconAction, BeaconActionLabel, CardPreset, CLASS_BEACON_DECK_BACK, DeckType, DOM_ENTITY_CLASS, DOMEntityType, DOMEntityTypeClass, DROP_TYPE_DECK, MIN_ABSOLUTE_INDEX, PropDOMEntityName, PropDOMEntityType, DECK_BUTTON_INDEX } from 'src/model';
import { DeckListConverter, ZIndexInstanceConverter, useDeckStore, useZIndexState, useCardEventStore, useDOMEntityStateStore } from 'src/state';
import styled from 'styled-components';
import { EyeOutlined, RetweetOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { DeckModalRef } from './deck-modal/deck-modal';
import { List } from 'immutable';
import './deck-button.scss';
import { Draggable, DraggableStateSnapshot, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd';
import { DraggableCard, MovableCard } from '../card';
import { mergeClass } from 'src/util';
import { createPortal } from 'react-dom';

const getDraggingClass = (style: DraggingStyle | NotDraggingStyle | undefined, snapshot: DraggableStateSnapshot): string => {
    /** Indicator để giúp user nhận biết vị trí sẽ drag */
    if (!snapshot.isDragging && (style?.transform ?? '').length > 0) return 'affected-by-dragging';
    if (snapshot.isDragging) return 'is-dragging';
    return '';
};
const getDraggingStyle = (style: DraggingStyle | NotDraggingStyle | undefined, snapshot: DraggableStateSnapshot): React.CSSProperties | undefined => {
    // if (snapshot.isDragging) {
    //     const { curve } = snapshot.dropAnimation ?? {};
    //     console.log('🚀 ~ file: deck-button.tsx:22', {
    //         ...style,
    //         top: '',
    //         left: '',
    //         transform: `${style?.transform ?? ''} translate(calc(0px - var(--card-width-sm) / 2))`,
    //         visibility: (snapshot.isDropAnimating || !style?.transform) ? 'hidden' : 'visible',
    //         /** Skip hết mức transition lúc drop để giảm giật layout */
    //         transition: (snapshot.isDropAnimating && snapshot.dropAnimation)
    //             ? `all ${curve} 0.001s, visibility 0s`
    //             : 'all ease 5s',
    //     });

    //     return {
    //         ...style,
    //         top: '',
    //         left: '',
    //         transform: `${style?.transform ?? ''} translate(calc(0px - var(--card-width-sm) / 2))`,
    //         visibility: snapshot.isDropAnimating ? 'hidden' : 'visible',
    //         /** Skip hết mức transition lúc drop để giảm giật layout */
    //         transition: (snapshot.isDropAnimating && snapshot.dropAnimation)
    //             ? `all ${curve} 0.001s, visibility 0s`
    //             : 'all cubic-bezier(.2,1,.1,1) 0.001s, visibility 0s',
    //     };
    // }
    // /** Skip việc transform lúc move dragging để giảm giật layout */
    // if (!snapshot.isDragging) return {
    //     ...style,
    //     transform: '',
    // };
    if (!snapshot.isDragging) return {
        ...style,
        transform: '',
    };
    if (snapshot.isDropAnimating && snapshot.dropAnimation) {
        const { curve } = snapshot.dropAnimation;

        return {
            ...style,
            visibility: snapshot.isDropAnimating ? 'hidden' : 'visible',
            transition: `all ${curve} 0.001s, visibility 0s`,
        };
    }
    return style;
};

const DeckButtonContainer = styled.div<{ $preset: CardPreset, $beaconCount: number, $top?: number, $left?: number }>`
    text-align: center;
    position: absolute;
    top: ${props => `${props.$top}px`};
    left: ${props => `${props.$left}px`};
    display: ${props => typeof props.$left === 'number' && typeof props.$top === 'number' ? 'inline-block' : 'none'};
    line-height: 0;
    z-index: 1;
    pointer-events: none;
    .deck-button-toolbar {
        display: none;
        column-gap: var(--spacing-xs);
        padding: var(--spacing-xs);
        position: absolute;
        width: 100%;
        pointer-events: all;
        .deck-button-tool {
            flex: 1;
            padding: var(--spacing-xs);
            line-height: 1;
            text-align: center;
            background-color: var(--main-metal);
            border: var(--bd);
            border-radius: var(--br);
            user-select: none;
            cursor: pointer;
            &:hover {
                background-color: var(--dim-metal);
                box-shadow: 0 0 1px 1px #222 inset;
            }
        }
    }
    .deck-back {
        height: var(--card-height);
        width: var(--card-width);
        background-size: contain;
        background-repeat: no-repeat;
        position: relative;
        .deck-back-beacon-list {
            position: relative;
            height: var(--card-height);
            width: 0;
            display: inline-block;
            z-index: 1;
            .deck-beacon {
                height: ${props => `calc(var(--card-height) / ${props.$beaconCount})`};
                width: var(--card-width);
            }
        }
    }
    .top-card {
        display: inline-block;
        height: var(--card-height);
        width: var(--card-width);
        vertical-align: bottom;
        img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
    }
    .deck-button-info {
        display: inline-block;
        position: absolute;
        background: var(--main-primaryLighter);
        font-weight: bold;
        text-align: center;
        border: var(--bd);
        border-radius: var(--br);
        padding: 0 var(--spacing-sm);
        margin-top: var(--spacing-xs);
        left: 50%;
        transform: translateX(-50%);
    }
    &.deck-button-force-show,
    &:hover {
        .deck-button-toolbar {
            display: flex;
        }
    }
`;

export type DeckButton = {
    name: string,
    displayName?: string,
    type: DeckType,
    preset?: CardPreset,
    offsetTop?: number, offsetLeft?: number,
    absoluteTop?: number, absoluteLeft?: number,
} & Pick<DeckModal, 'beaconList'>;
export const DeckButton = ({
    name,
    displayName = name,
    type,
    preset = 'normal',
    offsetTop, offsetLeft,
    absoluteTop, absoluteLeft,
    beaconList = [BeaconAction['top'], BeaconAction['shuffle'], BeaconAction['bottom']],
}: DeckButton) => {
    const [isVisible, setVisible] = useState(false);
    const deckModalRef = useRef<DeckModalRef>(null);
    const deckButtonRef = useRef<HTMLDivElement>(null);
    const beaconListRef = useRef<HTMLDivElement>(null);
    const {
        hide,
        focus,
        modalInstance,
    } = useZIndexState(
        state => ({
            modalInstance: state.categoryMap['modal'].queueMap.get(name, ZIndexInstanceConverter()),
            hide: state.reset,
            focus: state.toTop,
        }),
        (prev, next) => prev.modalInstance.get('name') === next.modalInstance.get('name')
            && prev.modalInstance.get('zIndex') === next.modalInstance.get('zIndex'),
    );
    const deckList = useDeckStore(
        state => state.deckMap.get(name, DeckListConverter()).get('cardList', List()),
        (oldState, newState) => oldState.equals(newState),
    );
    const draggCardFromDeckButtonToBoard = useCardEventStore(state => state.dragFromDeckButtonToBoard);
    const topDeckCard = deckList.get(0);
    console.log('🚀 ~ file: deck-button.tsx:193 ~ topDeckCard', topDeckCard);
    const nextTopDeckCard = deckList.get(1);
    const zIndex = modalInstance.get('zIndex');
    const commonBeaconProps = {
        className: CLASS_BEACON_DECK_BACK,
        style: { zIndex: 1 },
        deckId: name,
    };

    const portal = document.getElementById('modal-wrapper');
    const [test, setTest] = useState(false);

    if (!portal) return null;
    return createPortal(
        <DeckButtonContainer ref={deckButtonRef}
            className={mergeClass('deck-button', DOM_ENTITY_CLASS, DOMEntityTypeClass['deckButton'])}
            $preset={preset}
            $beaconCount={beaconList.length}
            $top={offsetTop ?? 0}
            $left={offsetLeft ?? 0}
            data-deck-button-name={name}
            style={{ zIndex: DECK_BUTTON_INDEX }}
            {...{
                [PropDOMEntityName]: name,
                [PropDOMEntityType]: DOMEntityType['deckButton'],
            }}
        >
            <div className="deck-button-toolbar" style={{ zIndex: 1 + 1 }}>
                <Tooltip overlay="View">
                    <div
                        className="deck-button-tool deck-button-tool-view" onClick={() => {
                            setVisible(true);
                            focus('modal', name);
                        }}
                    >
                        <EyeOutlined />
                    </div>
                </Tooltip>
                <Tooltip overlay="Shuffle">
                    <div
                        className="deck-button-tool deck-button-tool-shuffle"
                        onClick={() => deckModalRef.current?.shuffle()}
                    >
                        <RetweetOutlined />
                    </div>
                </Tooltip>
            </div>
            <DeckBeaconWrapper
                className="deck-back ygo-card-size-sm"
                style={{ zIndex: 1 }}
                onMouseEnter={() => {
                    beaconListRef.current?.classList.add('deck-back-beacon-active');
                }}
                onMouseLeave={() => {
                    beaconListRef.current?.classList.remove('deck-back-beacon-active', 'deck-back-beacon-suppress');
                }}
                zIndex={zIndex}
                isVisible={true}
            >
                {/**
             * Có một side-effect được trigger từ drag-n-drop
             * 
             * Ta muốn card nằm trên beacon khi kéo nó ra, nhưng lại muốn beacon nằm trên khi kéo sang deck khác, vậy nên ta để mặc định beacon ở trên card, và chèn class bằng side-effect để đẩy beacon xuống dưới khi chuẩn bị diễn ra việc drag. Việc này chỉ diễn ra 1 lần duy nhất.
             */}
                <div ref={beaconListRef} className="deck-back-beacon-list">
                    {beaconList.map(beaconAction => {
                        return <DeckBeacon key={beaconAction} {...commonBeaconProps} actionType={beaconAction}>
                            {BeaconActionLabel[beaconAction].shortLabel}
                        </DeckBeacon>;
                    })}
                </div>
                <div className="top-card">
                    <button onClick={() => setTest(true)} style={{
                        position: 'relative',
                        pointerEvents: 'all',
                        bottom: '15px',
                    }}>Click</button>
                    {(topDeckCard && true) && <MovableCard key={topDeckCard.get('card').get('_id')}
                        uniqueId={topDeckCard.get('card').get('_id')}
                        image={topDeckCard.get('card')}
                        origin={topDeckCard.get('origin')}
                        originEntity={DOMEntityType['deckButton']}
                        initialX={offsetLeft}
                        initialY={offsetTop}
                        onDragToBoard={(_id, origin) => {
                            draggCardFromDeckButtonToBoard(0, name);
                        }}
                        onMouseEnter={() => {
                            deckButtonRef.current?.classList.add('deck-button-force-show');
                        }}
                        onMouseLeave={() => {
                            deckButtonRef.current?.classList.remove('deck-button-force-show');
                        }}
                    />}
                    {/* {topDeckCard && <Droppable
                    droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${name}]-[ORIGIN-${type}]-[VARIANT-DeckButton]`}
                    direction="horizontal"
                    // isDropDisabled={true}
                >
                    {dropProvided => {
                        const card = topDeckCard.get('card');
                        const origin = topDeckCard.get('origin');
                        const _id = card.get('_id');
                        const cardId = `DeckButton-${name}-${_id}`;

                        return <div
                            ref={dropProvided.innerRef}
                            className="deck-result"
                            {...dropProvided.droppableProps}
                        >
                            <Draggable key={cardId}
                                index={0}
                                draggableId={cardId}
                            >
                                {(dragProvided, snapshot) => {
                                    return <DraggableCard ref={dragProvided.innerRef}
                                        uniqueId={cardId}
                                        image={card}
                                        origin={origin}
                                        {...dragProvided.dragHandleProps}
                                        {...dragProvided.draggableProps}
                                        className={getDraggingClass(dragProvided.draggableProps.style, snapshot)}
                                        style={getDraggingStyle(dragProvided.draggableProps.style, snapshot)}
                                    />;
                                }}
                            </Draggable>
                            <div style={{ display: 'none' }}>{dropProvided.placeholder}</div>
                        </div>;
                    }}
                </Droppable>} */}
                    {/* {deckList.size > 0 && <img src={`./asset/img/ygo-card-back-${preset}.png`} alt="top-card-back" />} */}
                </div>
            </DeckBeaconWrapper>
            {/* <div className="deck-button-info" style={{ zIndex: 1 + 1 }}>
            {displayName}
        </div> */}
            <DeckModal ref={deckModalRef}
                isVisible={isVisible}
                deckId={name}
                displayName={displayName}
                type={type}
                beaconList={beaconList}
                onClose={() => {
                    setVisible(false);
                    hide('modal', name);
                }}
            />
        </DeckButtonContainer>,
        portal,
    );
};