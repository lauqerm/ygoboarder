import { useRef, useState } from 'react';
import { DeckModal } from '.';
import { DeckBeacon, DeckBeaconWrapper } from './deck-beacon';
import { BeaconAction, CLASS_BEACON_DECK_BACK, DeckType } from 'src/model';
import { DeckListConverter, ModalInstanceConverter, useDeckStore, useModalStore } from 'src/state';
import styled from 'styled-components';
import { EyeOutlined, RetweetOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { DeckModalRef } from './deck-modal/deck-modal';
import { List } from 'immutable';
import './deck-button.scss';

type CardPreset = 'normal' | 'opp';
const DeckButtonContainer = styled.div<{ $preset: CardPreset }>`
    text-align: center;
    position: relative;
    display: inline-block;
    line-height: 0;
    .deck-button-toolbar {
        display: none;
        column-gap: var(--spacing-xs);
        padding: var(--spacing-xs);
        position: absolute;
        width: 100%;
        .deck-button-tool {
            flex: 1;
            padding: var(--spacing-xs);
            line-height: 1;
            text-align: center;
            background-color: var(--main-metal);
            border: var(--bd);
            border-radius: var(--br);
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
            .deck-beacon {
                height: calc(var(--card-height) / 3);
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
}
export const DeckButton = ({
    name,
    displayName = name,
    type,
    preset = 'normal',
}: DeckButton) => {
    const [isVisible, setVisible] = useState(false);
    const deckModalRef = useRef<DeckModalRef>(null);
    const beaconListRef = useRef<HTMLDivElement>(null);
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
    const deckList = useDeckStore(
        state => state.deckMap.get(name, DeckListConverter()).get('cardList', List()),
        (oldState, newState) => oldState.equals(newState),
    );
    const zIndex = modalInstance.get('zIndex');
    const commonBeaconProps = {
        className: CLASS_BEACON_DECK_BACK,
        style: { zIndex: 1 },
        deckId: name,
    };

    return <DeckButtonContainer className="deck-button" $preset={preset} style={{ zIndex: 1 }}>
        <div className="deck-button-toolbar" style={{ zIndex: 1 + 1 }}>
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
        <DeckBeaconWrapper
            className="deck-back ygo-card-size-sm"
            style={{ zIndex: 1 }}
            onMouseOver={() => {
                beaconListRef.current?.classList.add('deck-back-beacon-active');
            }}
            onMouseLeave={() => {
                beaconListRef.current?.classList.remove('deck-back-beacon-active');
            }}
            zIndex={zIndex}
            isVisible={true}
        >
            <div ref={beaconListRef} className="deck-back-beacon-list">
                <DeckBeacon {...commonBeaconProps} actionType={BeaconAction['top']}>
                    To top
                </DeckBeacon>
                <DeckBeacon {...commonBeaconProps} actionType={BeaconAction['shuffle']}>
                    Shuffle
                </DeckBeacon>
                <DeckBeacon {...commonBeaconProps} actionType={BeaconAction['bottom']}>
                    To bottom
                </DeckBeacon>
            </div>
            <div className="top-card">
                {deckList.size > 0 && <img src={`./asset/img/ygo-card-back-${preset}.png`} alt="top-card-back" />}
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
            onClose={() => {
                setVisible(false);
                hide(name);
            }}
        />
    </DeckButtonContainer>;
};