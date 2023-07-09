import { HotKeys } from 'react-hotkeys';
import { DeckModalHotkeyMap } from 'src/model';

export type DeckModalHotkeyController = {
    children?: React.ReactNode,
    handlerMap: Record<keyof typeof DeckModalHotkeyMap, (keyEvent?: KeyboardEvent | undefined) => void>,
}
export const DeckModalHotkeyController = ({
    children,
    handlerMap,
}: DeckModalHotkeyController) => {
    return <HotKeys
        keyMap={DeckModalHotkeyMap}
        handlers={handlerMap}
    >
        {children}
    </HotKeys>;
};