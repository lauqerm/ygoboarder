import { GlobalHotKeys } from 'react-hotkeys';
import { GlobalHotkeyMap } from 'src/model';
import { useEventState } from 'src/state';

export const GlobalHotkeyController = () => {
    const {
        escapeModal,
    } = useEventState(
        state => ({
            escapeModal: state.escapeModal,
        }),
        () => true,
    );

    return <GlobalHotKeys
        keyMap={GlobalHotkeyMap}
        handlers={{
            ESCAPE: () => {
                escapeModal();
            },
        } as Record<keyof typeof GlobalHotkeyMap, () => void>}
    />;
};