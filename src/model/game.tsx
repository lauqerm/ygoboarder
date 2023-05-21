export type TurnPhase = 'draw'
    | 'standby'
    | 'main1'
    | 'battle'
    | 'main2'
    | 'end';

export type TurnInfo = {
    key: TurnPhase,
    label: string,
    shortLabel: string,
    nextPhase: TurnPhase,
    prevPhase: TurnPhase,
}
export const DrawPhase: TurnInfo = {
    key: 'draw',
    label: 'Draw Phase',
    shortLabel: 'DP',
    nextPhase: 'end',
    prevPhase: 'standby',
};
export const StandbyPhase: TurnInfo = {
    key: 'standby',
    label: 'Standby Phase',
    shortLabel: 'SP',
    nextPhase: 'end',
    prevPhase: 'standby',
};
export const Main1Phase: TurnInfo = {
    key: 'main1',
    label: 'Main Phase 1',
    shortLabel: 'MP1',
    nextPhase: 'draw',
    prevPhase: 'battle',
};
export const BattlePhase: TurnInfo = {
    key: 'battle',
    label: 'Battle Phase',
    shortLabel: 'BP',
    nextPhase: 'main2',
    prevPhase: 'main1',
};
export const Main2Phase: TurnInfo = {
    key: 'main2',
    label: 'Main Phase 2',
    shortLabel: 'MP2',
    nextPhase: 'end',
    prevPhase: 'battle',
};
export const EndPhase: TurnInfo = {
    key: 'end',
    label: 'End Phase',
    shortLabel: 'EP',
    nextPhase: 'draw',
    prevPhase: 'main2',
};
export const TurnMap: Record<TurnPhase, TurnInfo> = {
    draw: DrawPhase,
    standby: StandbyPhase,
    main1: Main1Phase,
    battle: BattlePhase,
    main2: Main2Phase,
    end: EndPhase,
};
export const TurnList = Object.values(TurnMap);