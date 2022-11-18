import React, { useRef, useState } from 'react';
import { DeckModal } from '.';
import { DeckBeacon } from './deck-beacon';
import { Droppable } from 'react-beautiful-dnd';
import { BeaconAction, DeckType, DROP_TYPE_DECK } from 'src/model';
import { ModalInstanceConverter, useModalStore } from 'src/state';
import styled from 'styled-components';
import { EyeOutlined, RetweetOutlined } from '@ant-design/icons';
import './deck-button.scss';
import { Tooltip } from 'antd';
import { DeckModalRef } from './deck-modal/deck-modal';

const DeckButtonContainer = styled.div`
    border: var(--bd);
    border-radius: var(--br);
    overflow: hidden;
    .deck-button-toolbar {
        display: flex;
        column-gap: 1px;
        background-color: var(--bdColor);
        border-bottom: var(--bd);
        .deck-button-tool {
            flex: 1;
            padding: var(--spacing-xs);
            line-height: 1;
            text-align: center;
            background-color: var(--main-metal);
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
        background-image: url('./asset/img/ygo-card-back.png');
        background-size: contain;
        background-repeat: no-repeat;
        position: relative;
        .deck-back-beacon-list {
            position: relative;
            height: var(--card-height);
            width: 0;
            .deck-back-beacon-container {
                height: calc(var(--card-height) / 3);
                width: var(--card-width);
                .deck-beacon {
                    height: 100%;
                }
            }
        }
    }
    .deck-button-info {
        background: var(--main-colorLighter);
        font-weight: bold;
        text-align: center;
        border-top: var(--bd);
    }
`;

export type DeckButton = {
    name: string,
    type: DeckType,
}
export const DeckButton = ({
    name,
    type,
}: DeckButton) => {
    const [isVisible, setVisible] = useState(false);
    const deckModalRef = useRef<DeckModalRef>(null);
    const {
        hide,
        focus,
        modalInstance,
    } = useModalStore(
        state => ({
            modalInstance: state.modalMap.get(name, ModalInstanceConverter()),
            hide: state.reset,
            focus: state.increase,
        }),
        (prev, next) => prev.modalInstance.get('name') === next.modalInstance.get('name')
            && prev.modalInstance.get('zIndex') === next.modalInstance.get('zIndex'),
    );
    const zIndex = modalInstance.get('zIndex');

    return <DeckButtonContainer>
        <div className="deck-button-toolbar">
            <Tooltip overlay="View">
                <div
                    className="deck-button-tool deck-button-tool-view" onClick={() => {
                        setVisible(true);
                        focus(name);
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
        <div className="deck-back ygo-card-size-sm" onClick={() => {
            console.log('YES');
        }}>
            <div className="deck-back-beacon-list">
                <Droppable
                    droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${name}]-[ORIGIN-${type}]-[ACTION-${BeaconAction['top']}]`}
                    direction="horizontal"
                >
                    {(dropProvided, dropSnapshot) => {
                        return <div ref={dropProvided.innerRef} className="deck-back-beacon-container">
                            <DeckBeacon forceHighlight={dropSnapshot.isDraggingOver} deckId={name} zIndex={zIndex} actionType={BeaconAction['top']}>
                                Add to top
                            </DeckBeacon>
                            <span style={{ display: 'none' }}>{dropProvided.placeholder}</span>
                        </div>;
                    }}
                </Droppable>
                <Droppable
                    droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${name}]-[ORIGIN-${type}]-[ACTION-${BeaconAction['shuffle']}]`}
                    direction="horizontal"
                >
                    {(dropProvided, dropSnapshot) => {
                        return <div ref={dropProvided.innerRef} className="deck-back-beacon-container">
                            <DeckBeacon forceHighlight={dropSnapshot.isDraggingOver} deckId={name} zIndex={zIndex} actionType={BeaconAction['shuffle']}>
                                Add to shuffle
                            </DeckBeacon>
                            <span style={{ display: 'none' }}>{dropProvided.placeholder}</span>
                        </div>;
                    }}
                </Droppable>
                <Droppable
                    droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${name}]-[ORIGIN-${type}]-[ACTION-${BeaconAction['bottom']}]`}
                    direction="horizontal"
                >
                    {(dropProvided, dropSnapshot) => {
                        return <div ref={dropProvided.innerRef} className="deck-back-beacon-container">
                            <DeckBeacon forceHighlight={dropSnapshot.isDraggingOver} deckId={name} zIndex={zIndex} actionType={BeaconAction['bottom']}>
                                Add to bottom
                            </DeckBeacon>
                            <span style={{ display: 'none' }}>{dropProvided.placeholder}</span>
                        </div>;
                    }}
                </Droppable>
            </div>
        </div>
        <div className="deck-button-info">
            {name}
        </div>
        <DeckModal ref={deckModalRef}
            className={isVisible ? 'deck-modal-visible' : 'deck-modal-invisible'}
            deckId={name}
            type={type}
            onClose={() => {
                setVisible(false);
                hide(name);
            }}
        />
    </DeckButtonContainer>;
};