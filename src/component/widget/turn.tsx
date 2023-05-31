import { TurnList } from 'src/model';
import { useTurn } from 'src/state/turn-store';
import { mergeClass } from 'src/util';
import { CaretDownFilled, CaretUpFilled } from '@ant-design/icons';
import styled from 'styled-components';
import { useState } from 'react';

const TurnWidgetContainer = styled.div`
    display: flex;
    padding: 0 var(--spacing-xs);
    .phase-navigator {
        flex: 1 auto;
        display: flex;
        flex-direction: column;
        border: var(--bd-subtle);
        button {
            border-radius: 0;
            border: var(--bd-faint);
            background-color: var(--bdColor-faint);
            font-size: var(--fs-xs);
            padding-top: 0;
            padding-bottom: 0;
            font-weight: bold;
            cursor: pointer;
            &.active-phase {
                background-color: var(--main-info);
                color: var(--contrast-info);
                box-shadow: var(--bs-inset);
            }
            &:hover {
                background-color: var(--sub-info);
            }
            + button {
                border-top: none;
            }
        }
    }
    .turn-navigator-container {
        flex: 0 0 65px;
        position: relative;
        .turn-navigator {
            position: absolute;
            right: -1px;
            top: var(--spacing);
            background-color: var(--main-metal);
            color: var(--contrast-metal);
            border: var(--bd);
            border-right-color: var(--bdColor-blunt);
            border-radius: var(--br) 0 0 var(--br);
            width: 3rem;
            text-align: center;
            overflow: hidden;
            .turn-announce {
                height: 1.375rem;
                cursor: pointer;
                input {
                    width: 100%;
                    height: 100%;
                    color: var(--color);
                    border: none;
                    padding: var(--spacing-xxs) var(--spacing-sm);
                }
                &:hover {
                    background-color: var(--dim-metal);
                }
            }
            .prev-turn,
            .next-turn {
                cursor: pointer;
                &:hover {
                    background-color: var(--dim-metal);
                }
            }
            .prev-turn {
                border-bottom: var(--bd);
            }
            .next-turn {
                border-top: var(--bd);
            }
            .player-announce {
                text-transform: uppercase;
                line-height: 1;
                padding: var(--spacing-sm) 0;
                font-weight: bold;
                cursor: pointer;
            }
            .your-turn {
                background-color: var(--sub-your-color);
                color: var(--main-your-color);
                &:hover {
                    background-image: var(--gradient-hovered-light);
                }
            }
            .opp-turn {
                background-color: var(--sub-opp-color);
                color: var(--main-opp-color);
                &:hover {
                    background-image: var(--gradient-hovered-light);
                }
            }
        }
    }
`;

export const TurnWidget = () => {
    const {
        phase,
        player,
        turn,
    } = useTurn(
        state => ({
            turn: state.turn,
            phase: state.currentPhase,
            player: state.currentPlayer,
        }),
        (prev, next) => prev.phase === next.phase
            && prev.player === next.player
            && prev.turn === next.turn,
    );
    const changeTurn = useTurn(state => state.changeTurn);
    const [editMode, setEditMode] = useState(false);

    return <TurnWidgetContainer className="turn-widget">
        <div className="turn-navigator-container">
            <div className="turn-navigator">
                <div className="prev-turn" onClick={() => changeTurn(undefined, undefined, Math.max(0, turn - 1))}>
                    <CaretUpFilled />
                </div>
                <div className="turn-announce" onClick={() => setEditMode(true)}>
                    {editMode
                        ? <input
                            autoFocus
                            defaultValue={turn}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    try {
                                        changeTurn(undefined, player, parseInt(e.currentTarget.value));
                                    } catch (e) {
                                        changeTurn(undefined, player, 1);
                                    }
                                    setEditMode(false);
                                } else if (e.key === 'Escape') {
                                    setEditMode(false);
                                }
                            }}
                        />
                        : <>T{turn}</>}
                </div>
                <div
                    className={mergeClass('player-announce', `${player}-turn`)}
                    onClick={() => changeTurn()}
                >
                    {player}
                </div>
                <div className="next-turn" onClick={() => changeTurn(undefined, undefined, turn + 1)}>
                    <CaretDownFilled />
                </div>
            </div>
        </div>
        <div className="phase-navigator">
            {TurnList.map(({ key, shortLabel }) => {
                return <button key={key}
                    className={mergeClass('turn-widget-force', phase === key ? 'active-phase' : '')}
                    onClick={() => changeTurn(key, player)}
                >
                    {shortLabel}
                </button>;
            })}
        </div>
    </TurnWidgetContainer>;
};