import { Radio } from 'antd';
import axios from 'axios';
import queryString from 'query-string';
import { useEffect, useRef, useState } from 'react';
import { YGOProCardResponse, ygoproCardToDescription } from 'src/model';
import throttle from 'lodash.throttle';
import { AttributeText, RestrictionText } from 'src/component/atom';
import { DelayedImage } from 'src/component';
import styled from 'styled-components';
import { usePreviewStore } from 'src/state';
import { mergeClass } from 'src/util';
import { RequestorPayload, YGOImporterFilter } from './ygo-importer-filter';
import './ygopro-importer.scss';

const requestor = async (payload: RequestorPayload) => {
    const getPayloadList = (payload: RequestorPayload) => {
        const commonPayload: Record<string, any> = {};
        const payloadWithName: Record<string, any> = {};
        const payloadWithDesc: Record<string, any> = {};
        const { fname, desc } = payload;

        /** Trường hợp đặc biệt với text search, name và description là hai phép search tách biệt nên nếu tồn tại cả hai operator ta cần tách chúng ra làm hai payload riêng */
        if (typeof fname === 'string' && fname.length > 0) payloadWithName.fname = fname;
        if (typeof desc === 'string' && desc.length > 0) payloadWithDesc.desc = desc;

        return [
            payloadWithName,
            payloadWithDesc,
        ]
            .filter(payload => Object.keys(payload).length > 0)
            .map(payload => ({ ...payload, ...commonPayload }));
    };

    const queryParamList = getPayloadList(payload)
        .map(processedPayload => queryString.stringify(processedPayload))
        .filter(stringifiedParam => (stringifiedParam ?? '').length > 0);

    if (queryParamList.length === 0) return undefined;

    const matchedCardMap = (await Promise.all(queryParamList
        .map(param => axios<{ data: YGOProCardResponse[] }>(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${param}`)),
    ))
        .map(response => response.data.data)
        .flat()
        /** Loại bỏ kết quả trùng */
        .reduce((prev, curr) => {
            return { ...prev, [curr.id]: curr };
        }, {} as Record<string, YGOProCardResponse>);
    return Object
        .values(matchedCardMap)
        .sort((l, r) => l.name.localeCompare(r.name));
};

const YGOImporterContainer = styled.div`
    .display-mode {
        width: 100%;
        margin-bottom: var(--spacing);
    }
    .ygopro-importer-title {
        display: grid;
        grid-template-columns: 1fr max-content;
        .ant-radio-group {
            font-weight: normal;
        }
    }
    .ygopro-card-entry {
        position: relative;
        display: grid;
        grid-template-columns: 86px 1fr;
        column-gap: var(--spacing);
        margin-bottom: var(--spacing);
        padding-top: var(--spacing);
        cursor: pointer;
        &:hover {
            .card-statistic b {
                color: var(--sub-antd);
                text-decoration: underline;
            }
        }
        + .ygopro-card-entry {
            border-top: var(--bd-faint);
        }
        .image-container {
            position: relative;
        }
        .card-entry-image {
            width: var(--card-width-sm);
            height: var(--card-height-sm);
            img {
                max-width: 100%;
                max-height: 100%;
            }
            .stat-list {
                position: absolute;
                display: grid;
                grid-template-columns: 1fr 1fr;
                font-family: monospace;
                bottom: 0;
                width: 100%;
                text-align: right;
                background-color: #333333dd;
                padding: var(--spacing-xs);
                column-gap: var(--spacing-xs);
                .stat {
                    background-color: #fafafadd;
                    padding: 0 var(--spacing-xs);
                }
            }
            .restriction-text {
                position: absolute;
                top: 0;
                left: 0;
                border-radius: 0 0 var(--br) 0;
                border: var(--bd-blunt);
            }
        }
        .main-statistic {
            color: #000000;
            .rate,
            .attribute-text {
                display: inline-block;
                width: 65px;
            }
        }
        p {
            margin-top: var(--spacing-xs);
            margin-bottom: 0;
            line-height: 1.45;
            white-space: pre-line;
        }
    }
    .ygopro-card-list.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, 168px);
        gap: var(--spacing);
        margin-top: var(--spacing);
        .stat-list,
        .card-statistic {
            display: none;
        }
        /** Size của ygopro */
        .ygopro-card-entry {
            margin: 0;
            padding: 0;
            border: none;
            &:hover {
                outline: 4px solid var(--main-antd);
            }
        }
        .card-entry-image {
            width: 168px;
            height: 246px;
        }
    }
`;

export type YGOProImporter = {
    onSelect: (name: string, url: string, description: string) => void,
}
export const YGOProImporter = ({
    onSelect,
}: YGOProImporter) => {
    const [payload, setPayload] = useState<RequestorPayload>({});
    const [cardResponseList, setCardResponseList] = useState<YGOProCardResponse[]>([]);
    const [displayMode, setDisplayMode] = useState('grid');
    const throttledRequest = useRef(throttle(requestor, 100));
    const preview = usePreviewStore(state => state.setCardPreview);
    useEffect(() => {
        let relevant = true;

        (async () => {
            try {
                const response = await throttledRequest.current(payload);

                if (relevant && response) setCardResponseList(response);
            } catch (e) {
                console.error(e);
            }
        })();

        return () => {
            relevant = false;
        };
    }, [payload]);

    return <YGOImporterContainer className="ygopro-importer">
        <h2 className="ygopro-importer-title">
            Import from YGOPRODeck
            <Radio.Group
                size="small"
                className="display-mode"
                options={[
                    { label: 'List Mode', value: 'list' },
                    { label: 'Grid Mode', value: 'grid' },
                ]}
                onChange={e => setDisplayMode(e.target.value)}
                value={displayMode}
                optionType="button"
                buttonStyle="solid"
            />
        </h2>
        <YGOImporterFilter
            onPayloadChange={setPayload}
        />
        <div className={mergeClass('ygopro-card-list', displayMode)}>
            {cardResponseList
                .slice(0, 20)
                .map(card => {
                    const {
                        id,
                        card_images,
                        name,
                        desc,
                        type,
                        attribute,
                        frameType,
                        level,
                        linkval,
                        atk, def,
                        race,
                        banlist_info,
                    } = card;
                    const { ban_ocg } = banlist_info ?? {};
                    const { image_url_small, image_url } = card_images[0];
                    const isMonster = type.toLowerCase().includes('monster')
                        || type.toLowerCase().includes('token');
                    const isXyzMonster = frameType === 'xyz';
                    const isLinkMonster = frameType === 'link';

                    return <div key={id}
                        className="ygopro-card-entry"
                        onClick={() => onSelect(name, image_url_small, ygoproCardToDescription(card))}
                    >
                        <div className="card-entry-image">
                            <div className="image-container">
                                <RestrictionText limit={ban_ocg} />
                                {typeof image_url_small !== 'string'
                                    ? null
                                    : <DelayedImage key={id}
                                        type="URL"
                                        src={image_url_small}
                                        onMouseEnter={() => {
                                            if (displayMode === 'grid') preview('external', image_url, ygoproCardToDescription(card));
                                        }}
                                    />}
                                <div className="stat-list">
                                    <div className="stat">{atk}</div>
                                    <div className="stat">{def}</div>
                                </div>
                            </div>
                        </div>
                        <div className="card-statistic">
                            <b>{name}</b>
                            <br />
                            <div className="main-statistic truncate">
                                {isXyzMonster
                                    ? <div className="rate">RANK&nbsp;&nbsp;{level}</div>
                                    : isLinkMonster
                                        ? <div className="rate">LINK&nbsp;&nbsp;{linkval}</div>
                                        : isMonster
                                            ? <div className="rate">LEVEL&nbsp;{level}</div>
                                            : null}
                                {isMonster && <AttributeText attribute={attribute} />}
                                <span className="truncate">{race} {type}</span>
                            </div>
                            <p>{desc}</p>
                        </div>
                    </div>;
                })}
        </div>
    </YGOImporterContainer>;
};