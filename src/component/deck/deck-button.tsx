import React, { useState } from 'react';
import { DeckModal } from '.';
import './deck-button.scss';
import { DeckBeacon } from './deck-beacon';
import { Droppable } from 'react-beautiful-dnd';
import { BeaconAction, DECK_TYPE, DROP_TYPE_DECK } from 'src/model';
import { ModalInstanceConverter, useModalStore } from 'src/state';

export type DeckButton = {
    name: string,
    type: DECK_TYPE,
}
export const DeckButton = ({
    name,
    type,
}: DeckButton) => {
    const [isVisible, setVisible] = useState(false);
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

    return <div>
        {name} - {type}
        <div onClick={() => {
            setVisible(true);
            focus(name);
        }}>Open Deck</div>
        <div onClick={() => {
            setVisible(false);
            hide(name);
        }}>Close Deck</div>
        <DeckModal deckId={name} type={type} className={isVisible ? 'deck-modal-visible' : 'deck-modal-invisible'} />
        <Droppable
            droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${name}]-[ORIGIN-${type}]-[ACTION-${BeaconAction['top']}]`}
            direction="horizontal"
        >
            {(dropProvided) => {
                return <div
                    ref={dropProvided.innerRef}
                    style={{ height: 100 }}
                >
                    <DeckBeacon deckId={name} zIndex={zIndex} actionType={BeaconAction['top']}>Add to top</DeckBeacon>
                    <span style={{ display: 'none' }}>{dropProvided.placeholder}</span>
                </div>;
            }}
        </Droppable>
        <Droppable
            droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${name}]-[ORIGIN-${type}]-[ACTION-${BeaconAction['shuffle']}]`}
            direction="horizontal"
        >
            {(dropProvided) => {
                return <div
                    ref={dropProvided.innerRef}
                    style={{ height: 100 }}
                >
                    <DeckBeacon deckId={name} zIndex={zIndex} actionType={BeaconAction['shuffle']}>Add to shuffle</DeckBeacon>
                    <span style={{ display: 'none' }}>{dropProvided.placeholder}</span>
                </div>;
            }}
        </Droppable>
        <Droppable
            droppableId={`[TYPE-${DROP_TYPE_DECK}]-[ID-${name}]-[ORIGIN-${type}]-[ACTION-${BeaconAction['bottom']}]`}
            direction="horizontal"
        >
            {dropProvided => {
                return <div
                    ref={dropProvided.innerRef}
                    style={{ height: 100 }}
                >
                    <DeckBeacon deckId={name} zIndex={zIndex} actionType={BeaconAction['bottom']}>Add to bottom</DeckBeacon>
                    <span style={{ display: 'none' }}>{dropProvided.placeholder}</span>
                </div>;
            }}
        </Droppable>
    </div>;
};