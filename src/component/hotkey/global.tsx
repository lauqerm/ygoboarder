import { GlobalHotKeys } from 'react-hotkeys';
import { GlobalHotkeyMap } from 'src/model';
import { useCounterState, useEventState } from 'src/state';

export const GlobalHotkeyController = () => {
    const {
        escapeModal,
    } = useEventState(
        state => ({
            escapeModal: state.escapeModal,
        }),
        () => true,
    );
    const switchCounterMode = useCounterState(state => state.setCounterMode);

    return <GlobalHotKeys
        keyMap={GlobalHotkeyMap}
        handlers={{
            ESCAPE: () => {
                escapeModal();
                switchCounterMode(undefined);
            },
        } as Record<keyof typeof GlobalHotkeyMap, () => void>}
    />;
};