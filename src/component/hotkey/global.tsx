import { HotKeys } from 'react-hotkeys';
import { GlobalHotkeyMap } from 'src/model';
import { useEventState } from 'src/state';

export type GlobalHotkeyController = {
    children?: React.ReactNode,
}
export const GlobalHotkeyController = ({
    children,
}: GlobalHotkeyController) => {
    const {
        editDescription,
    } = useEventState(
        state => ({
            editDescription: state.editDescription,
        }),
        () => true,
    );

    return <HotKeys
        keyMap={GlobalHotkeyMap}
        handlers={{
            EDIT_DESCRIPTION: () => editDescription(),
        } as Record<keyof typeof GlobalHotkeyMap, (keyEvent?: KeyboardEvent | undefined) => void>}
    >
        {children}
    </HotKeys>;
};