import { HotKeys } from 'react-hotkeys';
import { BoardHotkeyMap } from 'src/model';
import { useEventState } from 'src/state';

export type BoardHotkeyController = {
    children?: React.ReactNode,
}
export const BoardHotkeyController = ({
    children,
}: BoardHotkeyController) => {
    const {
        editDescription,
    } = useEventState(
        state => ({
            editDescription: state.editDescription,
        }),
        () => true,
    );

    return <HotKeys
        keyMap={BoardHotkeyMap}
        handlers={{
            EDIT_DESCRIPTION: () => editDescription(),
        } as Record<keyof typeof BoardHotkeyMap, (keyEvent?: KeyboardEvent | undefined) => void>}
    >
        {children}
    </HotKeys>;
};