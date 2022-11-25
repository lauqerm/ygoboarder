import React, { useRef, useState } from 'react';
import { DeckModal } from '.';
import { DeckBeacon } from './deck-beacon';
import { BeaconAction, CLASS_BEACON_DECK_BACK, DeckType } from 'src/model';
import { ModalInstanceConverter, useModalStore } from 'src/state';
import styled from 'styled-components';
import { EyeOutlined, RetweetOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { DeckModalRef } from './deck-modal/deck-modal';
import './deck-button.scss';

const DeckButtonContainer = styled.div`
    text-align: center;
    position: relative;
    display: inline-block;
    .deck-button-toolbar {
        display: none;
        column-gap: var(--spacing-xs);
        padding: var(--spacing-xs);
        position: absolute;
        width: 100%;
        transform: translateY(-100%);
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
        background-image: url('./asset/img/ygo-card-back.png');
        background-size: contain;
        background-repeat: no-repeat;
        position: relative;
        .deck-back-beacon-list {
            position: relative;
            height: var(--card-height);
            width: 0;
            .deck-beacon {
                height: calc(var(--card-height) / 3);
                width: var(--card-width);
            }
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
    type: DeckType,
}
export const DeckButton = ({
    name,
    type,
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
    const zIndex = modalInstance.get('zIndex');
    const commonBeaconProps = {
        className: CLASS_BEACON_DECK_BACK,
        style: { zIndex: 1 },
        deckId: name,
        zIndex,
        isVisible: true,
    };

    return <DeckButtonContainer className="deck-button" style={{ zIndex: 1 }}>
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
        <div className="deck-back ygo-card-size-sm" style={{ zIndex: 1 }}
            onMouseOver={() => {
                beaconListRef.current?.classList.add('deck-back-beacon-active');
            }}
            onMouseLeave={() => {
                beaconListRef.current?.classList.remove('deck-back-beacon-active');
            }}
        >
            <div ref={beaconListRef} className="deck-back-beacon-list">
                <DeckBeacon {...commonBeaconProps} actionType={BeaconAction['top']}>
                    Add to top
                </DeckBeacon>
                <DeckBeacon {...commonBeaconProps} actionType={BeaconAction['shuffle']}>
                    Add to shuffle
                </DeckBeacon>
                <DeckBeacon {...commonBeaconProps} actionType={BeaconAction['bottom']}>
                    Add to bottom
                </DeckBeacon>
            </div>
        </div>
        <div className="deck-button-info" style={{ zIndex: 1 + 1 }}>
            {name}
        </div>
        <DeckModal ref={deckModalRef}
            isVisible={isVisible}
            deckId={name}
            type={type}
            onClose={() => {
                setVisible(false);
                hide(name);
            }}
        />
    </DeckButtonContainer>;
};