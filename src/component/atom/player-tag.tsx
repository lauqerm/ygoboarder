import { Tag } from 'antd';
import { Player } from 'src/model';
import styled from 'styled-components';

const PlayerTagContainer = styled(Tag)<{ $preset: Player }>`
    text-transform: uppercase;
    margin-right: 0;
`;
export type PlayerTag = {
    preset: Player
}
export const PlayerTag = ({
    preset,
}: PlayerTag) => {
    return <PlayerTagContainer $preset={preset} color={`var(--main-${preset}-color)`}>{preset}</PlayerTagContainer>;
};