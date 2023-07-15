import { Drawer } from 'antd';
import { useState } from 'react';
import { mergeClass } from 'src/util';
import styled from 'styled-components';
import { MenuButton } from '../atom';
import './manual.scss';

const Section = styled.div`
    h2 {
        text-decoration: underline;
    }
    h4 {
        color: var(--color-faint);
    }
`;
const Key = styled.span`
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing);
    line-height: 1;
    border: var(--bd);
    background-color: var(--main-contrast);
    border-radius: var(--br-sm);
    font-size: var(--fs-xs);
    font-family: 'Courier New', Courier, monospace;
    box-shadow: 0 1px 0 0 #aaa;
    transform: translateY(-2px);
`;
const Mouse = styled(Key) <{ $left?: boolean, $right?: boolean }>`
    width: 3.5rem;
    text-align: center;
    ${props => props.$left ? 'border-radius: var(--br-lg) 0 0 0;' : ''}
    ${props => props.$right ? 'border-radius: 0 var(--br-lg) 0 0;' : ''}
`;
const Text = styled.span`
    display: inline-block;
    padding: var(--spacing-xs);
    line-height: 1;
    color: var(--main-antd);
    border: var(--bd);
    border-color: var(--bdColor-faint);
    background-color: var(--main-disabled);
    border-radius: var(--br-sm);
    font-size: var(--fs-xs);
    font-family: 'Courier New', Courier, monospace;
    transform: translateY(-2px);
    word-wrap: break-word;
`;
export type Manual = {
    className?: string,
}
export const Manual = ({
    className,
}: Manual) => {
    const [isOpen, setOpen] = useState(false);

    return <>
        <MenuButton className={mergeClass('manual-button', className)} onClick={() => setOpen(true)}>
            {'Manual'}
        </MenuButton>
        <Drawer
            title="Manual"
            open={isOpen}
            className="manual-drawer"
            onClose={() => setOpen(false)}
            placement="left"
            width="500px"
        >
            <Section>
                <h2>Mouse Action</h2>
                <h3>Board</h3>
                <h4>Single card</h4>
                <ul>
                    <li>
                        <Mouse $left>Left</Mouse> - Switch face-up / face-down
                    </li>
                    <li>
                        <Mouse $right>Right</Mouse> - Switch Attack / Defense position
                    </li>
                    <li>
                        <Key>Ctrl</Key> + <Mouse $right>Right</Mouse> - Switch side
                    </li>
                </ul>
                <h4>Card group</h4>
                <ul>
                    <li>
                        <Mouse $left>Left</Mouse> - Spread out
                    </li>
                    <li>
                        <Mouse $right>Right</Mouse> - Stack
                    </li>
                </ul>
                <h4>Counter on card</h4>
                <ul>
                    <li>
                        <Mouse $left>Left</Mouse> - Increase by 1
                    </li>
                    <li>
                        <Mouse $right>Right</Mouse> - Decrease by 1
                    </li>
                    <li>
                        <Key>Ctrl</Key> + <Mouse $left>Left</Mouse> - Set amount
                    </li>
                </ul>
                <h3>Decklist modal</h3>
                <ul>
                    <li>
                        Double <Mouse $left>Left</Mouse> - Duplicate card
                    </li>
                    <li>
                        <Mouse $right>Right</Mouse> - Remove
                    </li>
                </ul>
            </Section>
            <Section>
                <h2>Hotkey</h2>
                <h3>Global</h3>
                <ul>
                    <li>
                        <Key>E</Key> - Edit custom card's description
                    </li>
                </ul>
                <h3>Decklist modal</h3>
                <ul>
                    <li>
                        <Key>A</Key> - Add new cards
                    </li>
                    <li>
                        <Key>G</Key> - Group card
                    </li>
                    <li>
                        <Key>S</Key> - Shuffle card list
                    </li>
                    <li>
                        <Key>C</Key> - Close modal
                    </li>
                </ul>
            </Section>
            <Section>
                <h2>Input</h2>
                <h3>Text search</h3>
                Supported pattern:
                <ul>
                    <li>
                        <Text>*</Text> - Match all characters, for example <Text>odd-eyes * dragon</Text> <b>will match</b> "Odd-Eyes Rebellion Dragon" but <b>not</b> "Supreme King Dragon Odd-Eyes".
                    </li>
                    <li>
                        <Text>|</Text> - Match whole word, for example <Text>chaos|</Text> <b>will match</b> "Chaos Ruler, the Chaotic Magical Dragon" but <b>not</b> "Chaosrider Gustaph".
                    </li>
                </ul>
                <h3>Stat search (Level/Rank/Link, ATK, DEF, Pendulum Scale)</h3>
                Supported pattern:
                <ul>
                    <li>
                        <Text>{'>='}</Text>, <Text>{'>'}</Text>, <Text>{'<='}</Text>, <Text>{'<'}</Text> - Basic mathematical comparison symbols.
                    </li>
                    <li>
                        <Text>-</Text> - Range search, for example <Text>1500-2000</Text> <b>will match</b> any monster with 1500 ATK, 1600 ATK or any number in between.
                    </li>
                    <li>
                        <Text>?</Text> - Search for undefined ATK / DEF are supported.
                    </li>
                </ul>
                <h3>Multiple select</h3>
                Supported pattern:
                <ul>
                    <li>
                        <Key>∋</Key> - Allow over-qualifying results, for example Link arrows Bottom-Left, Bottom-Right <b>will match</b> "Borrelend Dragon".
                    </li>
                    <li>
                        <Key>=</Key> - Only exact match results.
                    </li>
                    <li>
                        <Key>∈</Key> - Allow under-qualifying results, for example Link arrows Bottom-Left, Bottom-Right <b>will match</b> "Linguriboh".
                    </li>
                </ul>
                <h3>Numeric (LP, amount of Counter)</h3>
                Basic arithmetic expressions are supported:
                <ul>
                    <li>
                        <Text>1000 * 2</Text> result "2000".
                    </li>
                    <li>
                        <Text>1000 - 300 - 400</Text> result "300".
                    </li>
                </ul>
            </Section>
        </Drawer>
    </>;
};